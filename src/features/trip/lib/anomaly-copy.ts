import type { TripAnomaly, TripAnomalyKind } from "@/services/safety";

export interface AnomalyCopy {
  readonly title: string;
  readonly body: string;
  /** Loud styling. Reserved for the kinds that could mean she is in trouble. */
  readonly urgent: boolean;
}

const MINUTES = (detail: Record<string, unknown>): string => {
  const raw = detail.minutes;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? `${Math.round(n)}` : "several";
};

/**
 * What to say about an anomaly.
 *
 * The tone is doing real work here. These fire on ordinary events too — a long
 * queue at a junction, a detour around roadworks, a tunnel — so the copy asks
 * rather than accuses. A prompt that reads like an accusation trains her to
 * dismiss it, and the one that matters is the one she dismisses out of habit.
 *
 * `signal_lost` is deliberately NOT urgent: it is almost always coverage, and
 * making it loud would be crying wolf several times a week in Nairobi.
 */
export function anomalyCopy(anomaly: TripAnomaly): AnomalyCopy {
  switch (anomaly.kind) {
    case "route_deviation":
      return {
        title: "Is everything okay?",
        body: "Your car is heading away from your destination. There may be a good reason — but if anything feels wrong, get help now.",
        urgent: true,
      };
    case "long_stop":
      return {
        title: `Stopped for ${MINUTES(anomaly.detail)} minutes`,
        body: "Your car has not moved in a while. Traffic does this too. Tell us you are fine, or get help.",
        urgent: true,
      };
    case "signal_lost":
    default:
      // `default` is not dead code: `kind` crosses the wire as a plain string,
      // so a kind added server-side before the client ships would land here
      // rather than rendering an empty card during a safety event.
      return {
        title: "We have lost contact with your car",
        body: "Your driver's phone has stopped reporting its position. This is usually poor coverage, not a problem.",
        urgent: false,
      };
  }
}

/**
 * Which single anomaly to put in front of her.
 *
 * Never more than one: stacking three prompts on a safety screen during a
 * frightening moment is worse than showing the most serious one. Urgency wins
 * over recency, so a route deviation is not buried under a lost signal that
 * happened to fire a minute later.
 */
export function primaryAnomaly(anomalies: readonly TripAnomaly[]): TripAnomaly | null {
  if (anomalies.length === 0) return null;
  const rank: Record<TripAnomalyKind, number> = {
    route_deviation: 0,
    long_stop: 1,
    signal_lost: 2,
  };
  return [...anomalies].sort((a, b) => {
    const byRank = rank[a.kind] - rank[b.kind];
    if (byRank !== 0) return byRank;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  })[0];
}
