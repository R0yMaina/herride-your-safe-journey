import type { GeoPoint } from "@/types/ride";
import type { GeoResult } from "./geocoding";
import { markMapboxDown, mapboxToken } from "./mapbox-loader";

/**
 * Geocoding through the Mapbox Search API (v6). Forward search returns the
 * name, address AND coordinates in one response, which is the shape the
 * location picker needs, and results are biased toward the rider's position.
 */
const BASE = "https://api.mapbox.com/search/geocode/v6";
const COUNTRY = "ke";

interface MapboxFeature {
  readonly geometry?: { readonly coordinates?: [number, number] };
  readonly properties?: {
    readonly name?: string;
    readonly full_address?: string;
    readonly place_formatted?: string;
    readonly feature_type?: string;
  };
}

function toResult(f: MapboxFeature, override?: GeoPoint): GeoResult | null {
  const c = f.geometry?.coordinates;
  if (!c && !override) return null;
  const p = f.properties ?? {};
  return {
    label: p.name || p.place_formatted?.split(",")[0] || "Location",
    address: p.full_address || p.place_formatted || "",
    coords: override ?? { lat: c![1], lng: c![0] },
    // Mapbox leans administrative in this market; the kind lets the ranker
    // push "Nairobi" below an actual mall or building.
    kind: p.feature_type,
  };
}

async function getJson(url: string): Promise<{ features?: MapboxFeature[] }> {
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) markMapboxDown();
    throw new Error(`Mapbox geocoding failed (${res.status})`);
  }
  return (await res.json()) as { features?: MapboxFeature[] };
}

export async function searchPlacesMapbox(
  query: string,
  near?: GeoPoint | null,
): Promise<GeoResult[]> {
  const proximity = near ? `&proximity=${near.lng},${near.lat}` : "";
  const url =
    `${BASE}/forward?q=${encodeURIComponent(query)}` +
    `&limit=6&country=${COUNTRY}&language=en${proximity}` +
    `&access_token=${mapboxToken()}`;
  const data = await getJson(url);
  return (data.features ?? []).map((f) => toResult(f)).filter((r): r is GeoResult => r !== null);
}

export async function reverseGeocodeMapbox(point: GeoPoint): Promise<GeoResult | null> {
  const url =
    `${BASE}/reverse?longitude=${point.lng}&latitude=${point.lat}` +
    `&limit=1&language=en&access_token=${mapboxToken()}`;
  const data = await getJson(url);
  const first = data.features?.[0];
  // Keep the exact pin position — only the label comes from Mapbox.
  return first ? toResult(first, point) : null;
}
