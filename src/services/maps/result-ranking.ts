import type { GeoPoint } from "@/types/ride";

export interface RankableResult {
  readonly label: string;
  readonly address: string;
  readonly coords: GeoPoint;
  /** Provider's own classification, e.g. Photon's `type` or Mapbox's feature type. */
  readonly kind?: string;
}

/**
 * Place kinds that describe a whole area rather than somewhere a car can
 * stop. A rider searching "Yaya" wants the mall, not the city of Nairobi —
 * these are pushed below anything specific.
 */
const BROAD_KINDS = new Set([
  "country",
  "state",
  "region",
  "province",
  "county",
  "district",
  "city",
  "town",
  "village",
  "locality",
  "postcode",
  "place",
  "macroregion",
  "neighbourhood",
  "suburb",
]);

/** Rough km between two points — good enough for ordering. */
function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = a.lat - b.lat;
  const dLng = (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180);
  return Math.sqrt(dLat * dLat + dLng * dLng) * 111;
}

function isBroad(r: RankableResult): boolean {
  return Boolean(r.kind && BROAD_KINDS.has(r.kind.toLowerCase()));
}

/**
 * Ranks geocoder hits for a rider picking a destination.
 *
 * Two rules, in order:
 *  1. Specific places beat broad areas. A result like "Nairobi, Kenya" is
 *     useless as a drop-off, so it only surfaces if nothing specific matched.
 *  2. Closer beats further, when a reference point is known — "Two Rivers
 *     Mall" in Nairobi should outrank the one in Tennessee.
 *
 * Duplicates across providers are collapsed: same label within ~100m.
 */
export function rankResults<T extends RankableResult>(
  results: readonly T[],
  near?: GeoPoint | null,
  limit = 6,
): T[] {
  const deduped: T[] = [];
  for (const r of results) {
    const dupe = deduped.find(
      (d) =>
        d.label.trim().toLowerCase() === r.label.trim().toLowerCase() &&
        distanceKm(d.coords, r.coords) < 0.1,
    );
    if (!dupe) deduped.push(r);
  }

  return deduped
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const broadA = isBroad(a.r) ? 1 : 0;
      const broadB = isBroad(b.r) ? 1 : 0;
      if (broadA !== broadB) return broadA - broadB;
      if (near) {
        const d = distanceKm(a.r.coords, near) - distanceKm(b.r.coords, near);
        if (Math.abs(d) > 0.5) return d;
      }
      return a.i - b.i; // otherwise keep provider order
    })
    .slice(0, limit)
    .map(({ r }) => r);
}
