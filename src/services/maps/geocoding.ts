import type { GeoPoint } from "@/types/ride";
import { hasGoogleAuthFailed, isGoogleMapsEnabled } from "./google-loader";
import { mapboxUsable } from "./mapbox-loader";
import { rankResults, type RankableResult } from "./result-ranking";

export interface GeoResult extends RankableResult {
  readonly label: string;
  readonly address: string;
  readonly coords: GeoPoint;
  /** Provider classification, used only for ranking. */
  readonly kind?: string;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    type?: string;
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
  return {
    label: p.name || p.street || p.city || "Location",
    address,
    coords: { lat, lng },
    kind: p.type,
  };
}

/**
 * Address search (autocomplete) via Photon — a free, keyless, CORS-enabled
 * geocoder built for typeahead. Results are biased toward `near` when given.
 * Returns [] on any failure so the caller degrades gracefully.
 */
/** Give up on a provider rather than let it stall the whole search box. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

/**
 * Place search for the booking flow.
 *
 * Providers are queried IN PARALLEL rather than in a chain. A chain fails
 * badly here: if the first provider is merely slow or silently returns
 * nothing, the rider waits and then gets whatever the weaker provider said —
 * which is how "Yaya Centre" ends up showing "Nairobi, Kenya". Racing them
 * and ranking the union means the best answer wins regardless of which
 * service is healthy.
 *
 * Results are ranked so specific places beat broad areas (see rankResults).
 */
export async function searchPlaces(query: string, near?: GeoPoint | null): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const sources: Promise<GeoResult[]>[] = [withTimeout(searchPhoton(q, near), 4000, [])];

  if (isGoogleMapsEnabled() && !hasGoogleAuthFailed()) {
    sources.push(
      withTimeout(
        (async () => {
          const { hasPlacesKey, searchPlacesGooglePlaces } = await import("./google-places");
          return hasPlacesKey() ? searchPlacesGooglePlaces(q, near) : [];
        })(),
        4000,
        [],
      ),
    );
  }

  if (mapboxUsable()) {
    sources.push(
      withTimeout(
        (async () => {
          const { searchPlacesMapbox } = await import("./mapbox-geocoding");
          return searchPlacesMapbox(q, near);
        })(),
        4000,
        [],
      ),
    );
  }

  const settled = await Promise.allSettled(sources);
  const merged = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  return rankResults(merged, near);
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
