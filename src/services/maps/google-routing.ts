import type { GeoPoint } from "@/types/ride";
import { loadGoogleMaps } from "./google-loader";
import type { RoadRoute } from "./osrm";
import { normalizeManeuver, stripHtml, type RouteStep } from "./route-steps";

/**
 * Road-following route from Google Directions.
 *
 * `drivingOptions.departureTime` is what turns on traffic: with it, each leg
 * carries `duration_in_traffic` alongside the free-flow `duration`, so we can
 * quote the road as it is now and still say how much of that is congestion.
 * Supports intermediate stops so a multi-stop trip is priced on the real
 * driving path, and returns the same shape as the OSRM router so callers are
 * provider-agnostic.
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
    drivingOptions: {
      // "Now" plus nothing: Google rejects a departure time in the past, and
      // a request made a moment ago can land a second late.
      departureTime: new Date(Date.now() + 1000),
      trafficModel: g.maps.TrafficModel.BEST_GUESS,
    },
  });
  const route = result.routes[0];
  if (!route) return null;

  let meters = 0;
  let freeFlowSeconds = 0;
  let trafficSeconds = 0;
  let sawTraffic = false;
  const steps: RouteStep[] = [];

  // Sum every leg so multi-stop trips report the whole journey.
  for (const leg of route.legs) {
    meters += leg.distance?.value ?? 0;
    const plain = leg.duration?.value ?? 0;
    const withTraffic = leg.duration_in_traffic?.value;
    freeFlowSeconds += plain;
    if (typeof withTraffic === "number") {
      trafficSeconds += withTraffic;
      sawTraffic = true;
    } else {
      trafficSeconds += plain;
    }

    for (const s of leg.steps ?? []) {
      const at = s.start_location;
      if (!at) continue;
      steps.push({
        instruction: stripHtml(s.instructions ?? "") || "Continue",
        maneuver: normalizeManeuver(s.maneuver),
        distanceKm: (s.distance?.value ?? 0) / 1000,
        durationMin: (s.duration?.value ?? 0) / 60,
        at: { lat: at.lat(), lng: at.lng() },
      });
    }
  }

  return {
    coordinates: route.overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })),
    distanceKm: meters / 1000,
    durationMin: trafficSeconds / 60,
    // Absent unless Google actually answered with traffic — a missing reading
    // must not be presented as clear roads.
    freeFlowDurationMin: sawTraffic ? freeFlowSeconds / 60 : undefined,
    steps: steps.length ? steps : undefined,
    provider: "google",
  };
}
