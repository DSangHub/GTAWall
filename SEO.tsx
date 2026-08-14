import { Helmet } from "react-helmet-async";

const BASE_URL = "https://www.gtawall.com";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Normalize image URL to absolute for social crawlers.
 * Relative paths like /manus-storage/... become https://www.gtawall.com/manus-storage/...
 */
function toAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function SEO({
  title = "GTA Wall | Going To Auction — Pre-Auction Vehicle Marketplace",
  description = "Buy vehicles before they hit auction. Dealers post cars, trucks & SUVs going to auction in 5 days. Browse the wall, make offers, and save thousands.",
  keywords = "GTA Wall, going to auction, pre-auction vehicles, buy cars before auction, GTA dealers, used cars Toronto, vehicle auction countdown, apply for credit, dealer credit application",
  image = "/manus-storage/hero-banner_7a2a3d1e.jpg",
  url = "https://www.gtawall.com",
  type = "website",
}: SEOProps) {
  const fullTitle = title.includes("GTA Wall") ? title : `${title} | GTA Wall`;
  const absoluteImage = toAbsoluteUrl(image);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content="GTA Wall" />
      <meta property="og:locale" content="en_CA" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
}
