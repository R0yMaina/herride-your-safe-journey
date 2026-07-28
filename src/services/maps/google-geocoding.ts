import type { GeoPoint } from "@/types/ride";
import { loadGoogleMaps } from "./google-loader";
import type { GeoResult } from "./geocoding";

/** Bias results toward the market we operate in. */
const REGION = "KE";

function splitAddress(formatted: string): { label: string; address: string } {
  const parts = formatted.split(",").map((p) => p.trim());
  return {
    label: parts[0] || "Location",
    address: parts.length > 1 ? parts.slice(1).join(", ") : formatted,
  };
}

function toResult(r: google.maps.GeocoderResult): GeoResult {
  const { label, address } = splitAddress(r.formatted_address);
  return {
    label,
    address,
    coords: { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() },
  };
}

/**
 * Place search through Google's Geocoder. One request returns both the
 * address and its coordinates, which is exactly the shape the picker needs —
 * Places Autocomplete would need a second lookup per result to resolve
 * coordinates, at extra cost per keystroke.
 */
export async function searchPlacesGoogle(
  query: string,
  near?: GeoPoint | null,
): Promise<GeoResult[]> {
  const g = await loadGoogleMaps();
  const geocoder = new g.maps.Geocoder();
  const request: google.maps.GeocoderRequest = { address: query, region: REGION };
  if (near) {
    // Nudge results toward the rider without hard-filtering them out.
    request.bounds = new g.maps.LatLngBounds(
      new g.maps.LatLng(near.lat - 0.35, near.lng - 0.35),
      new g.maps.LatLng(near.lat + 0.35, near.lng + 0.35),
    );
  }
  const { results } = await geocoder.geocode(request);
  return results.slice(0, 6).map(toResult);
}

/** Reverse geocode a dropped pin to a street address. */
export async function reverseGeocodeGoogle(point: GeoPoint): Promise<GeoResult | null> {
  const g = await loadGoogleMaps();
  const geocoder = new g.maps.Geocoder();
  const { results } = await geocoder.geocode({ location: point });
  const first = results[0];
  return first ? { ...toResult(first), coords: point } : null;
}
