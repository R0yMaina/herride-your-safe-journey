import type { GeoPoint } from "@/types/ride";

/** The manoeuvre types every provider agrees on, normalised to one vocabulary. */
export type StepManeuver =
  | "depart"
  | "turn-left"
  | "turn-right"
  | "turn-slight-left"
  | "turn-slight-right"
  | "turn-sharp-left"
  | "turn-sharp-right"
  | "uturn"
  | "straight"
  | "merge"
  | "fork-left"
  | "fork-right"
  | "roundabout"
  | "ramp"
  | "arrive";

/** One instruction on the way. */
export interface RouteStep {
  /** Plain text — never HTML. Google returns markup; it is stripped on ingest. */
  readonly instruction: string;
  readonly maneuver: StepManeuver;
  readonly distanceKm: number;
  readonly durationMin: number;
  /** Where the manoeuvre happens, for "in 200 m, turn left". */
  readonly at: GeoPoint;
  readonly roadName?: string;
}

/**
 * Maps Google's and Mapbox's manoeuvre vocabularies onto ours.
 *
 * Both providers describe the same turns with different words, and the driver
 * panel should not care which one answered. Anything unrecognised becomes
 * "straight", which is the safe reading: the instruction text still says what
 * to do, only the arrow is generic.
 */
export function normalizeManeuver(raw: string | null | undefined): StepManeuver {
  if (!raw) return "straight";
  const key = raw.toLowerCase().replace(/_/g, "-").trim();

  const exact: Record<string, StepManeuver> = {
    depart: "depart",
    arrive: "arrive",
    "turn-left": "turn-left",
    "turn-right": "turn-right",
    "turn-slight-left": "turn-slight-left",
    "turn-slight-right": "turn-slight-right",
    "turn-sharp-left": "turn-sharp-left",
    "turn-sharp-right": "turn-sharp-right",
    "turn-straight": "straight",
    uturn: "uturn",
    "uturn-left": "uturn",
    "uturn-right": "uturn",
    straight: "straight",
    merge: "merge",
    "fork-left": "fork-left",
    "fork-right": "fork-right",
    "ramp-left": "ramp",
    "ramp-right": "ramp",
    "on-ramp": "ramp",
    "off-ramp": "ramp",
    "roundabout-left": "roundabout",
    "roundabout-right": "roundabout",
    roundabout: "roundabout",
    rotary: "roundabout",
    "keep-left": "fork-left",
    "keep-right": "fork-right",
    "end-of-road": "straight",
    "new-name": "straight",
    continue: "straight",
    notification: "straight",
  };
  if (exact[key]) return exact[key];

  // Mapbox sends type + modifier separately ("turn" + "slight left"); some
  // callers concatenate them, so fall back to matching on the words present.
  const left = key.includes("left");
  const right = key.includes("right");
  if (key.includes("uturn")) return "uturn";
  if (key.includes("roundabout") || key.includes("rotary")) return "roundabout";
  if (key.includes("ramp")) return "ramp";
  if (key.includes("merge")) return "merge";
  if (key.includes("fork") || key.includes("keep")) {
    return left ? "fork-left" : right ? "fork-right" : "straight";
  }
  if (key.includes("sharp"))
    return left ? "turn-sharp-left" : right ? "turn-sharp-right" : "straight";
  if (key.includes("slight")) {
    return left ? "turn-slight-left" : right ? "turn-slight-right" : "straight";
  }
  if (left) return "turn-left";
  if (right) return "turn-right";
  return "straight";
}

/** Google returns instructions as HTML ("Turn <b>left</b> onto Ngong Rd"). */
export function stripHtml(html: string): string {
  return html
    .replace(/<div[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * How much worse traffic is making this trip, as a ratio of the traffic-aware
 * duration to the free-flow one. 1 means clear roads.
 *
 * Returns null rather than 1 when the provider gave no traffic reading — the
 * UI must be able to tell "clear" apart from "we don't know", or it will claim
 * clear roads on a provider that simply cannot see them.
 */
export function trafficRatio(route: {
  readonly durationMin: number;
  readonly freeFlowDurationMin?: number;
}): number | null {
  if (route.freeFlowDurationMin === undefined || route.freeFlowDurationMin <= 0) return null;
  return route.durationMin / route.freeFlowDurationMin;
}

/** Ratio above which we tell her the roads are unusually bad. */
export const HEAVY_TRAFFIC_RATIO = 1.25;

export function isHeavyTraffic(route: {
  readonly durationMin: number;
  readonly freeFlowDurationMin?: number;
}): boolean {
  const ratio = trafficRatio(route);
  return ratio !== null && ratio >= HEAVY_TRAFFIC_RATIO;
}
