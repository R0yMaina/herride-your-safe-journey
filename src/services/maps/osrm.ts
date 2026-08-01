import type { GeoPoint } from "@/types/ride";
import { hasGoogleAuthFailed, isGoogleMapsEnabled } from "./google-loader";
import { mapboxUsable } from "./mapbox-loader";
import { normalizeManeuver, type RouteStep } from "./route-steps";

export interface RoadRoute {
  /** Ordered points that follow the road network, for drawing the line. */
  readonly coordinates: readonly GeoPoint[];
  readonly distanceKm: number;
  /**
   * Minutes to drive it. Traffic-aware when the provider could see traffic —
   * this is the number quoted to the rider and used to price the trip.
   */
  readonly durationMin: number;
  /**
   * The same trip on empty roads. Present only when the provider gave a
   * traffic reading, so `undefined` means "we cannot see traffic", which is
   * not the same as "the roads are clear".
   */
  readonly freeFlowDurationMin?: number;
  /** Turn-by-turn instructions, when the provider returned them. */
  readonly steps?: readonly RouteStep[];
  readonly provider: "mapbox" | "google" | "osrm";
}

/**
 * Fetches a road-following route between two points.
 *
 * Provider order is Mapbox → Google → OSRM. The first two are traffic-aware
 * (Mapbox's `driving-traffic` profile, Google's `drivingOptions`) and return
 * turn-by-turn steps; the OSRM demo server returns steps but cannot see
 * traffic, so a route from it carries no `freeFlowDurationMin` and the UI says
 * nothing about congestion rather than claiming clear roads.
 *
 * Note: `router.project-osrm.org` is a shared demo endpoint with no SLA. The
 * caller always falls back to a straight line if this returns null, so nothing
 * breaks when every provider is down.
 */
export async function fetchRoadRoute(
  from: GeoPoint,
  to: GeoPoint,
  via: readonly GeoPoint[] = [],
): Promise<RoadRoute | null> {
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
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson&steps=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
        legs?: {
          steps?: {
            distance: number;
            duration: number;
            name?: string;
            maneuver?: {
              type?: string;
              modifier?: string;
              location?: [number, number];
            };
          }[];
        }[];
      }[];
    };
    const route = data.routes?.[0];
    if (!route) return null;

    const steps: RouteStep[] = [];
    for (const leg of route.legs ?? []) {
      for (const s of leg.steps ?? []) {
        const [lng, lat] = s.maneuver?.location ?? [];
        if (lat === undefined || lng === undefined) continue;
        const road = s.name?.trim() || undefined;
        const maneuver = normalizeManeuver(
          [s.maneuver?.type, s.maneuver?.modifier].filter(Boolean).join(" "),
        );
        steps.push({
          // OSRM ships no prose, only a manoeuvre — so build the sentence.
          instruction: osrmInstruction(maneuver, road),
          maneuver,
          distanceKm: s.distance / 1000,
          durationMin: s.duration / 60,
          at: { lat, lng },
          roadName: road,
        });
      }
    }

    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      steps: steps.length ? steps : undefined,
      provider: "osrm",
    };
  } catch {
    return null;
  }
}

const MANEUVER_PROSE: Record<string, string> = {
  depart: "Start off",
  arrive: "Arrive",
  "turn-left": "Turn left",
  "turn-right": "Turn right",
  "turn-slight-left": "Bear left",
  "turn-slight-right": "Bear right",
  "turn-sharp-left": "Sharp left",
  "turn-sharp-right": "Sharp right",
  uturn: "Make a U-turn",
  straight: "Continue",
  merge: "Merge",
  "fork-left": "Keep left",
  "fork-right": "Keep right",
  roundabout: "At the roundabout, continue",
  ramp: "Take the ramp",
};

function osrmInstruction(maneuver: string, road: string | undefined): string {
  const verb = MANEUVER_PROSE[maneuver] ?? "Continue";
  if (!road) return verb;
  return maneuver === "arrive" ? `${verb} at ${road}` : `${verb} onto ${road}`;
}
