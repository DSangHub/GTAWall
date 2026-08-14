import type { Request, Response } from "express";
import { makeRequest } from "./_core/map";

interface GeocodingResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  status: string;
}

/**
 * GET /api/geocode?address=...
 * Returns { lat, lng, formatted_address } or 404 if not found.
 */
export async function geocodeHandler(req: Request, res: Response) {
  const address = req.query.address as string;

  if (!address || !address.trim()) {
    return res.status(400).json({ error: "Missing address parameter" });
  }

  try {
    const result = await makeRequest<GeocodingResponse>(
      "/maps/api/geocode/json",
      { address: address.trim() }
    );

    if (result.status === "OK" && result.results.length > 0) {
      const { lat, lng } = result.results[0].geometry.location;
      return res.json({
        lat,
        lng,
        formatted_address: result.results[0].formatted_address,
      });
    }

    return res.status(404).json({ error: "Address not found" });
  } catch (error) {
    console.error("[Geocode] Error:", error);
    return res.status(500).json({ error: "Geocoding service unavailable" });
  }
}
