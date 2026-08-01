import type { GeoPoint } from "@/types/ride";
import type { RouteStep } from "@/services/maps/route-steps";
import { haversineKm } from "@/lib/geo";

/**
 * Which instruction the driver is on, given where she actually is.
 *
 * Not "the nearest manoeuvre": the nearest point to a car mid-block is as
 * often the turn behind it as the one ahead, and showing her a turn she has
 * already taken is worse than showing nothing. Instead we work out which
 * *segment* of the route she is on — the pair of manoeuvre points she lies
 * between — and the instruction is the one at the end of it, which is exactly
 * what a driver needs to hear.
 */
export interface NavigationProgress {
  readonly step: RouteStep | null;
  readonly next: RouteStep | null;
  readonly index: number;
  /** Straight-line distance to the current manoeuvre, in km. */
  readonly distanceToStepKm: number | null;
  readonly remaining: number;
}

/** Within this radius the manoeuvre counts as done. ~35 m. */
const REACHED_KM = 0.035;

export function navigationProgress(
  steps: readonly RouteStep[],
  position: GeoPoint | null,
  /** The furthest step already reached, so progress never rewinds. */
  floor = 0,
  reachedKm = REACHED_KM,
): NavigationProgress {
  if (steps.length === 0) {
    return { step: null, next: null, index: 0, distanceToStepKm: null, remaining: 0 };
  }
  const last = steps.length - 1;
  const start = Math.min(Math.max(floor, 0), last);

  let index = start;
  if (position) {
    // Which segment is she on? The one where going via her adds least detour:
    // d(a,p) + d(p,b) equals d(a,b) exactly when p lies between a and b.
    let best = Infinity;
    for (let i = 0; i < last; i += 1) {
      const a = steps[i].at;
      const b = steps[i + 1].at;
      const detour = haversineKm(a, position) + haversineKm(position, b) - haversineKm(a, b);
      if (detour < best) {
        best = detour;
        index = i + 1;
      }
    }
    // Sitting on a manoeuvre point is geometrically ambiguous — both adjoining
    // segments fit equally well — so step past anything she has arrived at.
    while (index < last && haversineKm(position, steps[index].at) <= reachedKm) {
      index += 1;
    }
    // `floor` clamps the answer rather than restricting the search, so a fix
    // that lands behind her cannot rewind the panel to a turn already taken.
    index = Math.max(index, start);
  }

  return {
    step: steps[index] ?? null,
    next: steps[index + 1] ?? null,
    index,
    distanceToStepKm: position ? haversineKm(position, steps[index].at) : null,
    remaining: steps.length - index,
  };
}

/** "in 200 m" / "in 1.2 km" / "now" — the phrasing a driver can act on. */
export function distanceCue(km: number | null): string {
  if (km === null) return "";
  if (km < 0.03) return "now";
  if (km < 1) return `in ${Math.round((km * 1000) / 10) * 10} m`;
  return `in ${km.toFixed(1)} km`;
}

/**
 * A deep link into a real navigation app.
 *
 * HeRide draws the route and reads the turns, but it is not a satnav: it has
 * no voice, no lane guidance and no rerouting when she misses a turn. Handing
 * off to Google Maps or Waze is the honest option for the driving itself.
 */
export function navigationDeepLink(to: GeoPoint, app: "google" | "waze" = "google"): string {
  if (app === "waze") return `https://waze.com/ul?ll=${to.lat},${to.lng}&navigate=yes`;
  return `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=driving`;
}
