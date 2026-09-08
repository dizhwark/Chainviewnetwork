import { Injectable, Logger } from "@nestjs/common";

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  approximate: boolean;
}

/**
 * Map provider abstraction (docs/architecture.md §8). Supports Mapbox or
 * Google Maps behind MAP_PROVIDER; without an API key it falls back to a
 * deterministic mock geocoder over common Toronto FSA (postal-code prefix)
 * centroids, so address search and coverage checks keep working in an
 * offline/sandboxed dev environment. This mock is never used if a real key
 * is configured, and always returns approximate: true so the UI can label
 * it accordingly.
 */
@Injectable()
export class GeocodingService {
  private readonly logger = new Logger("GeocodingService");

  // Approximate centroids for common Downtown Toronto FSAs — good enough for
  // coverage checks and dev/demo flows, NOT a substitute for real geocoding.
  private readonly mockFsaCentroids: Record<string, { lat: number; lng: number }> = {
    M4: { lat: 43.6845, lng: -79.3417 },
    M5: { lat: 43.6511, lng: -79.3806 },
    M6: { lat: 43.6629, lng: -79.4504 },
    M7: { lat: 43.6631, lng: -79.3947 },
    M8: { lat: 43.6205, lng: -79.5132 },
    M9: { lat: 43.6889, lng: -79.5616 },
  };

  async geocode(address: { line1: string; city: string; province: string; postalCode: string }): Promise<GeocodeResult> {
    const provider = process.env.MAP_PROVIDER ?? "mock";

    if (provider === "mapbox" && process.env.MAPBOX_ACCESS_TOKEN) {
      return this.geocodeMapbox(address);
    }
    if (provider === "google" && process.env.GOOGLE_MAPS_API_KEY) {
      return this.geocodeGoogle(address);
    }

    this.logger.warn(`[DEV FALLBACK] MAP_PROVIDER=mock (no API key configured) — using canned FSA centroid geocoding.`);
    const fsa = address.postalCode.replace(/\s/g, "").slice(0, 2).toUpperCase();
    // Unknown FSAs deliberately do NOT fall back to a Toronto centroid — that would make
    // every out-of-zone postal code falsely appear covered. Instead we return a fixed,
    // clearly-outside-Toronto point (~50km NE, near Oshawa) so coverage checks behave
    // correctly for addresses this tiny demo lookup table doesn't recognize.
    const UNKNOWN_FSA_FALLBACK = { lat: 43.9, lng: -78.85 };
    const centroid = this.mockFsaCentroids[fsa] ?? UNKNOWN_FSA_FALLBACK;
    return {
      lat: centroid.lat,
      lng: centroid.lng,
      formattedAddress: `${address.line1}, ${address.city}, ${address.province} (approximate)`,
      approximate: true,
    };
  }

  private async geocodeMapbox(address: {
    line1: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<GeocodeResult> {
    const query = encodeURIComponent(`${address.line1}, ${address.city}, ${address.province} ${address.postalCode}`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=ca&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data: any = await res.json();
    const feature = data.features?.[0];
    if (!feature) throw new Error("Address could not be geocoded");
    const [lng, lat] = feature.center;
    return { lat, lng, formattedAddress: feature.place_name, approximate: false };
  }

  private async geocodeGoogle(address: {
    line1: string;
    city: string;
    province: string;
    postalCode: string;
  }): Promise<GeocodeResult> {
    const query = encodeURIComponent(`${address.line1}, ${address.city}, ${address.province} ${address.postalCode}, Canada`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data: any = await res.json();
    const result = data.results?.[0];
    if (!result) throw new Error("Address could not be geocoded");
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
      approximate: false,
    };
  }
}
