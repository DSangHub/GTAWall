import { type Request, type Response } from "express";
import { getDb } from "./db";
import { vehicles } from "../drizzle/schema";
import { eq, gt, and, desc } from "drizzle-orm";

const BASE_URL = "https://www.gtawall.com";

/**
 * Generate a dynamic XML sitemap with all active vehicle detail pages
 * plus static pages.
 */
export async function sitemapHandler(_req: Request, res: Response) {
  try {
    const db = await getDb();
    let vehicleRows: { id: number; updatedAt: Date }[] = [];

    if (db) {
      const now = Date.now();
      vehicleRows = await db
        .select({ id: vehicles.id, updatedAt: vehicles.updatedAt })
        .from(vehicles)
        .where(and(eq(vehicles.isActive, true), gt(vehicles.auctionDeadline, now)))
        .orderBy(desc(vehicles.createdAt));
    }

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "hourly" },
      { loc: "/dealer-signup", priority: "0.8", changefreq: "monthly" },
      { loc: "/dealer-subscription", priority: "0.7", changefreq: "monthly" },
    ];

    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}${page.loc}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic vehicle pages
    for (const v of vehicleRows) {
      const lastmod = v.updatedAt.toISOString().split("T")[0];
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/vehicle/${v.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>0.9</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Error generating sitemap");
  }
}

/**
 * Serve robots.txt with sitemap reference and crawl directives.
 */
export function robotsHandler(_req: Request, res: Response) {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /admin
Disallow: /api/

Sitemap: ${BASE_URL}/sitemap.xml
`;

  res.set("Content-Type", "text/plain");
  res.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
  res.status(200).send(robotsTxt);
}
