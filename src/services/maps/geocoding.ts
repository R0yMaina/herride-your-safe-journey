import type { GeoPoint } from "@/types/ride";
import { hasGeocodingKey, hasGoogleAuthFailed } from "./google-loader";
// Value import is safe here: google-places is a plain fetch module (env +
// types only) and pulls in none of the Google JS SDK.
import { hasPlacesKey } from "./google-places";
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
/**
 * Sentinel for a provider that never answered, kept distinct from `[]` so a
 * timeout can't be mistaken for a genuine "no matches here".
 */
const TIMED_OUT: GeoResult[] = [];

/** Give up on a provider rather than let it stall the whole search box. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);
}

/** What a search run produced, and whether any provider was reachable. */
export interface SearchOutcome {
  readonly results: GeoResult[];
  /** True when every provider errored or timed out — a network fault. */
  readonly unavailable: boolean;
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
export async function searchPlaces(query: string, near?: GeoPoint | null): Promise<SearchOutcome> {
  const q = query.trim();
  if (q.length < 3) return { results: [], unavailable: false };

  const sources: Promise<GeoResult[]>[] = [withTimeout(searchPhoton(q, near), 4000, TIMED_OUT)];

  // Gated on the Places key alone, NOT on the basemap provider. Which engine
  // draws tiles has nothing to do with which geocoders can answer a search,
  // and tying them together meant a configured Places key was silently unused
  // whenever the basemap was Mapbox or Leaflet.
  // The key check happens HERE, not inside the closure: a provider that is
  // switched off must not be enlisted at all, because returning [] from it
  // would count as "answered" and mask a total outage of the others.
  if (!hasGoogleAuthFailed() && hasPlacesKey()) {
    sources.push(
      withTimeout(
        (async () => {
          const { searchPlacesGooglePlaces } = await import("./google-places");
          return searchPlacesGooglePlaces(q, near);
        })(),
        4000,
        TIMED_OUT,
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
        TIMED_OUT,
      ),
    );
  }

  const settled = await Promise.allSettled(sources);
  const answered = settled.filter(
    (r): r is PromiseFulfilledResult<GeoResult[]> =>
      r.status === "fulfilled" && r.value !== TIMED_OUT,
  );
  const merged = answered.flatMap((r) => r.value);

  return {
    results: rankResults(merged, near),
    // Nobody answered: this is a connectivity problem, not a bad query, and
    // telling her to "try a different search" would send her chasing her own
    // spelling while the real fault is the network.
    unavailable: answered.length === 0,
  };
}

/** Photon typeahead — free, keyless, CORS-enabled, strong on OSM POI data. */
async function searchPhoton(q: string, near?: GeoPoint | null): Promise<GeoResult[]> {
  const bias = near ? `&lat=${near.lat}&lon=${near.lng}` : "";
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en${bias}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photon search failed (${res.status})`);
  const data = (await res.json()) as { features?: PhotonFeature[] };
  return (data.features ?? []).map(toResult);
}

/** Reverse geocode a point to an address (for tap/drag-to-select on the map). */
export async function reverseGeocode(point: GeoPoint): Promise<GeoResult | null> {
  // Same reasoning as search: a usable key is what matters, not the basemap.
  // Time-boxed, because this path loads the Google JS SDK — if that request
  // hangs (blocked network, bad key) an unbounded await would leave the
  // caller's label stuck on "Locating…" forever instead of trying Photon.
  if (!hasGoogleAuthFailed() && hasGeocodingKey()) {
    try {
      const result = await withTimeout(
        (async () => {
          const { reverseGeocodeGoogle } = await import("./google-geocoding");
          return reverseGeocodeGoogle(point);
        })(),
        4000,
        null,
      );
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
