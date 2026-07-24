import type { GeoPoint, RideRecord } from "@/types/ride";
import { haversineKm } from "@/lib/geo";

/** Everything a ranking strategy may consider about the driver's context.
 * Extend this (rating, acceptance rate, surge, safety score, …) without
 * touching callers — screens only ever see the interface. */
export interface RankingContext {
  /** The driver's current position, if known. */
  readonly driverPosition: GeoPoint | null;
}

export interface RankedRide {
  readonly ride: RideRecord;
  /** Straight-line pickup distance from the driver, when computable. */
  readonly distanceKm: number | null;
}

/**
 * Orders the open-ride pool for presentation to a driver. Pure and
 * synchronous by design: the pool is already filtered by the database
 * (RLS shows verified female drivers only 'requested' rides), so ranking
 * is a display/priority concern that can be swapped without touching
 * dispatch correctness — claiming stays atomic in claim_ride regardless
 * of which strategy produced the ordering.
 */
export interface IRideRankingStrategy {
  readonly name: string;
  rank(rides: readonly RideRecord[], context: RankingContext): readonly RankedRide[];
}

/** v1 strategy: closest pickup first; rides with unknown distance keep
 * their original (oldest-first) order after the ranked ones. */
export class NearestFirstRanking implements IRideRankingStrategy {
  readonly name = "nearest-first";

  rank(rides: readonly RideRecord[], context: RankingContext): readonly RankedRide[] {
    const ranked = rides.map((ride) => ({
      ride,
      distanceKm: context.driverPosition ? haversineKm(context.driverPosition, ride.pickup) : null,
    }));
    return [...ranked].sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }
}
