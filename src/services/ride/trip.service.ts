import type { GeoPoint, Place, RouteEstimate } from "@/types/ride";

export interface ITripService {
  estimateRoute(pickup: Place, destination: Place): Promise<RouteEstimate>;
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

class MockTripService implements ITripService {
  async estimateRoute(pickup: Place, destination: Place): Promise<RouteEstimate> {
    await new Promise<void>((r) => setTimeout(r, 200));
    const distanceKm = Math.max(0.5, haversineKm(pickup.coords, destination.coords));
    const durationMin = Math.max(3, Math.round(distanceKm * 2.4));
    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      durationMin,
      polyline: interpolate(pickup.coords, destination.coords),
    };
  }
}

export const tripService: ITripService = new MockTripService();