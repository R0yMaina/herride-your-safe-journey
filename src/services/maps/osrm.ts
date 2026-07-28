import type { GeoPoint } from "@/types/ride";

export interface RoadRoute {
  /** Ordered points that follow the road network, for drawing the line. */
  readonly coordinates: readonly GeoPoint[];
  readonly distanceKm: number;
  readonly durationMin: number;
}

/**
 * Fetches a road-following route between two points from the public OSRM demo
 * server — free, keyless, CORS-enabled. Perfect for an MVP: the drawn line
 * follows real streets instead of a straight hop, and we get distance + ETA.
 *
 * Note: `router.project-osrm.org` is a shared demo endpoint with no SLA. For
 * production, self-host OSRM or swap in a keyed routing provider — the caller
 * always falls back to a straight line if this returns null, so nothing breaks.
 */
export async function fetchRoadRoute(
  from: GeoPoint,
  to: GeoPoint,
  via: readonly GeoPoint[] = [],
): Promise<RoadRoute | null> {
  const coords = [from, ...via, to].map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }[];
    };
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };
  } catch {
    return null;
  }
}
