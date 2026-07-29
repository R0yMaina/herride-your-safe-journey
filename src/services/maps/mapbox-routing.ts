import type { GeoPoint } from "@/types/ride";
import type { RoadRoute } from "./osrm";
import { markMapboxDown, mapboxToken } from "./mapbox-loader";

/**
 * Road-following route from the Mapbox Directions API. Supports intermediate
 * stops so multi-stop trips price the whole journey, and returns the same
 * shape as the OSRM router so callers stay provider-agnostic.
 *
 * Unlike the public OSRM demo server this has an actual SLA, which matters
 * because fare quoting depends on the distance it returns.
 */
export async function fetchRoadRouteMapbox(
  from: GeoPoint,
  to: GeoPoint,
  via: readonly GeoPoint[] = [],
): Promise<RoadRoute | null> {
  const coords = [from, ...via, to].map((p) => `${p.lng},${p.lat}`).join(";");
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}` +
    `?geometries=geojson&overview=full&access_token=${mapboxToken()}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) markMapboxDown();
    throw new Error(`Mapbox directions failed (${res.status})`);
  }
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
}
