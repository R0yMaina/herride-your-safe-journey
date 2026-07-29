import type { GeoPoint } from "@/types/ride";
import { hasGoogleAuthFailed, isGoogleMapsEnabled } from "./google-loader";
import { mapboxUsable } from "./mapbox-loader";

export interface GeoResult {
  readonly label: string;
  readonly address: string;
  readonly coords: GeoPoint;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

function toResult(f: PhotonFeature): GeoResult {
  const p = f.properties;
  const [lng, lat] = f.geometry.coordinates;
  const line1 = [p.name, [p.housenumber, p.street].filter(Boolean).join(" ")]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");
  const line2 = [p.city, p.state, p.country].filter(Boolean).join(", ");
  const address = [line1, line2].filter(Boolean).join(" · ") || line2 || "Selected location";
  return { label: p.name || p.street || p.city || "Location", address, coords: { lat, lng } };
}

/**
 * Address search (autocomplete) via Photon — a free, keyless, CORS-enabled
 * geocoder built for typeahead. Results are biased toward `near` when given.
 * Returns [] on any failure so the caller degrades gracefully.
 */
export async function searchPlaces(query: string, near?: GeoPoint | null): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  // Photon leads deliberately. Measured against Nairobi landmarks it is the
  // only provider that finds them: "Yaya Centre" and "Two Rivers Mall" return
  // nothing from Mapbox, and "Sarit Centre" resolves to a village 400km away.
  // A ride-hailing app in Nairobi lives on landmark search, so the keyless
  // geocoder with the best local POI data goes first; the paid providers are
  // the fallback, not the other way round.
  const photon = await searchPhoton(q, near);
  if (photon.length > 0) return photon;

  if (isGoogleMapsEnabled() && !hasGoogleAuthFailed()) {
    try {
      const { hasPlacesKey, searchPlacesGooglePlaces } = await import("./google-places");
      if (hasPlacesKey()) {
        const results = await searchPlacesGooglePlaces(q, near);
        if (results.length > 0) return results;
      }
    } catch {
      /* fall through */
    }
    try {
      const { searchPlacesGoogle } = await import("./google-geocoding");
      const results = await searchPlacesGoogle(q, near);
      if (results.length > 0) return results;
    } catch {
      /* fall through */
    }
  }

  if (mapboxUsable()) {
    try {
      const { searchPlacesMapbox } = await import("./mapbox-geocoding");
      return await searchPlacesMapbox(q, near);
    } catch {
      /* nothing left to try */
    }
  }
  return [];
}

/** Photon typeahead — free, keyless, CORS-enabled, strong on OSM POI data. */
async function searchPhoton(q: string, near?: GeoPoint | null): Promise<GeoResult[]> {
  const bias = near ? `&lat=${near.lat}&lon=${near.lng}` : "";
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en${bias}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };
    return (data.features ?? []).map(toResult);
  } catch {
    return [];
  }
}

/** Reverse geocode a point to an address (for tap/drag-to-select on the map). */
export async function reverseGeocode(point: GeoPoint): Promise<GeoResult | null> {
  if (isGoogleMapsEnabled() && !hasGoogleAuthFailed()) {
    try {
      const { reverseGeocodeGoogle } = await import("./google-geocoding");
      const result = await reverseGeocodeGoogle(point);
      if (result) return result;
    } catch {
      /* fall through to Photon */
    }
  }
  // Photon before Mapbox for the same reason as search: on a Nairobi pin it
  // names the place ("Fitro Kenya, Ring Road Kilimani") where Mapbox returns
  // a bare street number ("008, Kilimani").
  const url = `https://photon.komoot.io/reverse?lat=${point.lat}&lon=${point.lng}`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { features?: PhotonFeature[] };
      const f = data.features?.[0];
      if (f) return { ...toResult(f), coords: point };
    }
  } catch {
    /* fall through */
  }

  if (mapboxUsable()) {
    try {
      const { reverseGeocodeMapbox } = await import("./mapbox-geocoding");
      return await reverseGeocodeMapbox(point);
    } catch {
      /* nothing left to try */
    }
  }
  return null;
}
