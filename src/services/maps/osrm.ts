import type { GeoPoint } from "@/types/ride";
import { hasGoogleAuthFailed, isGoogleMapsEnabled } from "./google-loader";
import { mapboxUsable } from "./mapbox-loader";

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
  // Mapbox first (it has an SLA, unlike the OSRM demo server), then Google,
  // then OSRM — routing, and therefore fare quoting, never depends on a
  // single provider.
  if (mapboxUsable()) {
    try {
      const { fetchRoadRouteMapbox } = await import("./mapbox-routing");
      const route = await fetchRoadRouteMapbox(from, to, via);
      if (route) return route;
    } catch {
      /* fall through */
    }
  }

  if (isGoogleMapsEnabled() && !hasGoogleAuthFailed()) {
    try {
      const { fetchRoadRouteGoogle } = await import("./google-routing");
      const route = await fetchRoadRouteGoogle(from, to, via);
      if (route) return route;
    } catch {
      /* fall through to OSRM */
    }
  }

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
