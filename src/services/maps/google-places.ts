import { env } from "@/config/env";
import type { GeoPoint } from "@/types/ride";
import type { GeoResult } from "./geocoding";

/**
 * Place search through the Places API (New) Text Search endpoint.
 *
 * Chosen over Autocomplete because a single response carries the display
 * name, the formatted address AND the coordinates — Autocomplete returns
 * only predictions, forcing a second billed Details call per result just to
 * learn where the place is. This endpoint is CORS-enabled, so it runs
 * straight from the browser with its own key.
 */
const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const FIELD_MASK = "places.displayName,places.formattedAddress,places.location";

interface PlacesResponse {
  readonly places?: {
    readonly displayName?: { readonly text?: string };
    readonly formattedAddress?: string;
    readonly location?: { readonly latitude: number; readonly longitude: number };
  }[];
}

export function hasPlacesKey(): boolean {
  return Boolean(env.map.googlePlacesApiKey);
}

export async function searchPlacesGooglePlaces(
  query: string,
  near?: GeoPoint | null,
): Promise<GeoResult[]> {
  const key = env.map.googlePlacesApiKey;
  if (!key) return [];

  const body: Record<string, unknown> = {
    textQuery: query,
    maxResultCount: 6,
    languageCode: "en",
    regionCode: "KE",
  };
  if (near) {
    // Bias, not a hard filter — a rider searching an airport still finds it.
    body.locationBias = {
      circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 40000 },
    };
  }

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Places search failed (${res.status})`);

  const data = (await res.json()) as PlacesResponse;
  return (data.places ?? [])
    .filter((p) => p.location)
    .map((p) => ({
      label: p.displayName?.text || p.formattedAddress?.split(",")[0] || "Location",
      address: p.formattedAddress ?? "",
      coords: { lat: p.location!.latitude, lng: p.location!.longitude },
    }));
}
