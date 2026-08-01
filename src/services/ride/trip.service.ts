import type { GeoPoint, Place, RouteEstimate } from "@/types/ride";
import { fetchRoadRoute } from "@/services/maps/osrm";

export interface ITripService {
  /** Estimate the full route pickup → (stops…) → destination. */
  estimateRoute(
    pickup: Place,
    destination: Place,
    stops?: readonly Place[],
  ): Promise<RouteEstimate>;
}

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function interpolate(a: GeoPoint, b: GeoPoint, steps = 12): readonly GeoPoint[] {
  const points: GeoPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const jitter = Math.sin(t * Math.PI) * 0.008;
    points.push({
      lat: a.lat + (b.lat - a.lat) * t + jitter,
      lng: a.lng + (b.lng - a.lng) * t - jitter,
    });
  }
  return points;
}

/** Straight-line fallback summed leg by leg, used when OSRM is unreachable. */
function haversineEstimate(points: readonly GeoPoint[]): RouteEstimate {
  let distanceKm = 0;
  const polyline: GeoPoint[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    distanceKm += haversineKm(points[i], points[i + 1]);
    polyline.push(...interpolate(points[i], points[i + 1]));
  }
  distanceKm = Math.max(0.5, distanceKm);
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationMin: Math.max(3, Math.round(distanceKm * 2.4)),
    polyline,
  };
}

/**
 * Road-first route estimation: asks OSRM for the real multi-leg driving route
 * (so the quoted distance/ETA matches what the trip map draws), falling back
 * to a straight-line approximation when the free routing service is down.
 * Same implementation for mock and live modes — routing has no backend state.
 */
class RoadTripService implements ITripService {
  async estimateRoute(
    pickup: Place,
    destination: Place,
    stops: readonly Place[] = [],
  ): Promise<RouteEstimate> {
    const via = stops.map((s) => s.coords);
    const road = await fetchRoadRoute(pickup.coords, destination.coords, via);
    if (road) {
      return {
        distanceKm: Math.round(road.distanceKm * 10) / 10,
        durationMin: Math.max(1, Math.round(road.durationMin)),
        freeFlowDurationMin:
          road.freeFlowDurationMin === undefined
            ? undefined
            : Math.max(1, Math.round(road.freeFlowDurationMin)),
        polyline: road.coordinates,
      };
    }
    return haversineEstimate([pickup.coords, ...via, destination.coords]);
  }
}

export const tripService: ITripService = new RoadTripService();
