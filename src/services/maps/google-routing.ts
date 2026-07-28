import type { GeoPoint } from "@/types/ride";
import { loadGoogleMaps } from "./google-loader";
import type { RoadRoute } from "./osrm";

/**
 * Road-following route from Google Directions. Supports intermediate stops so
 * a multi-stop trip is priced on the real driving path, and returns the same
 * shape as the OSRM router so callers are provider-agnostic.
 */
export async function fetchRoadRouteGoogle(
  from: GeoPoint,
  to: GeoPoint,
  via: readonly GeoPoint[] = [],
): Promise<RoadRoute | null> {
  const g = await loadGoogleMaps();
  const service = new g.maps.DirectionsService();
  const result = await service.route({
    origin: from,
    destination: to,
    waypoints: via.map((p) => ({ location: p, stopover: true })),
    travelMode: g.maps.TravelMode.DRIVING,
  });
  const route = result.routes[0];
  if (!route) return null;

  // Sum every leg so multi-stop trips report the whole journey.
  let meters = 0;
  let seconds = 0;
  for (const leg of route.legs) {
    meters += leg.distance?.value ?? 0;
    seconds += leg.duration?.value ?? 0;
  }
  return {
    coordinates: route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })),
    distanceKm: meters / 1000,
    durationMin: seconds / 60,
  };
}
