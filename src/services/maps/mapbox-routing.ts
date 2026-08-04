import type { GeoPoint } from "@/types/ride";
import type { RoadRoute } from "./osrm";
import { normalizeManeuver, type RouteStep } from "./route-steps";
import { markMapboxDown, mapboxToken } from "./mapbox-loader";

interface MapboxStep {
  readonly distance: number;
  readonly duration: number;
  readonly name?: string;
  readonly maneuver?: {
    readonly type?: string;
    readonly modifier?: string;
    readonly instruction?: string;
    readonly location?: [number, number];
  };
}

interface MapboxRoute {
  readonly distance: number;
  readonly duration: number;
  /** Present on the driving-traffic profile: the same route on empty roads. */
  readonly duration_typical?: number;
  readonly geometry: { readonly coordinates: [number, number][] };
  readonly legs?: { readonly steps?: MapboxStep[] }[];
}

/**
 * Road-following route from the Mapbox Directions API, on the
 * `driving-traffic` profile so the duration reflects the roads as they are
 * now rather than as they are at 3am. `duration_typical` comes back alongside
 * it, which is what lets the UI say "slower than usual" instead of guessing.
 *
 * Returns the same shape as the OSRM router so callers stay
 * provider-agnostic. Unlike the public OSRM demo server this has an actual
 * SLA, which matters because fare quoting depends on what it returns.
 */
export async function fetchRoadRouteMapbox(
  from: GeoPoint,
  to: GeoPoint,
  via: readonly GeoPoint[] = [],
): Promise<RoadRoute | null> {
  const coords = [from, ...via, to].map((p) => `${p.lng},${p.lat}`).join(";");
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}` +
    `?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken()}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) markMapboxDown();
    throw new Error(`Mapbox directions failed (${res.status})`);
  }
  const data = (await res.json()) as { routes?: MapboxRoute[] };
  const route = data.routes?.[0];
  if (!route) return null;

  const steps: RouteStep[] = [];
  for (const leg of route.legs ?? []) {
    for (const s of leg.steps ?? []) {
      const [lng, lat] = s.maneuver?.location ?? [];
      if (lat === undefined || lng === undefined) continue;
      steps.push({
        instruction: s.maneuver?.instruction?.trim() || "Continue",
        maneuver: normalizeManeuver(
          [s.maneuver?.type, s.maneuver?.modifier].filter(Boolean).join(" "),
        ),
        distanceKm: s.distance / 1000,
        durationMin: s.duration / 60,
        at: { lat, lng },
        roadName: s.name?.trim() || undefined,
      });
    }
  }

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    // Only report a free-flow figure when Mapbox actually sent one — an
    // absent field must not read as "traffic is clear".
    freeFlowDurationMin:
      typeof route.duration_typical === "number" ? route.duration_typical / 60 : undefined,
    steps: steps.length ? steps : undefined,
    provider: "mapbox",
  };
}
