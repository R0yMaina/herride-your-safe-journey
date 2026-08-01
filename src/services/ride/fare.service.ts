import type { FareEstimate, RideOption, RouteEstimate } from "@/types/ride";
import { pricingService } from "@/services/pricing";
import type { FareBreakdown } from "@/services/pricing";

export interface IFareService {
  /**
   * @param surgeMultiplier live demand multiplier for the pickup point; 1 for
   * none. It is an estimate — the value she is actually charged is locked onto
   * the ride row by the database when she books.
   */
  estimate(
    route: RouteEstimate,
    option: RideOption,
    surgeMultiplier?: number,
  ): Promise<FareEstimate>;
}

/** Adapts the engine's FareBreakdown to the UI-facing FareEstimate shape. */
export function toFareEstimate(b: FareBreakdown): FareEstimate {
  return {
    currency: b.currency,
    baseFare: b.baseFare,
    distanceCost: b.distanceCost,
    timeCost: b.timeCost,
    bookingFee: b.bookingFee,
    surge: b.surge,
    discount: b.discount,
    total: b.passengerTotal,
  };
}

/**
 * v1 fare estimate. This is now a thin adapter over the centralized Pricing
 * Engine (`@/services/pricing`) — the engine is the single source of truth, so
 * there is exactly one fare formula on the platform. Kept pure and
 * deterministic; the signature is unchanged so existing callers are untouched.
 */
export function computeFare(
  route: RouteEstimate,
  option: RideOption,
  surgeMultiplier = 1,
): FareEstimate {
  return toFareEstimate(
    pricingService.quote({
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      category: option.id,
      categoryMultiplier: option.baseMultiplier,
      // Never below 1: a bad read must not quietly discount the ride.
      demandMultiplier: Math.max(surgeMultiplier, 1),
    }),
  );
}

class MockFareService implements IFareService {
  async estimate(
    route: RouteEstimate,
    option: RideOption,
    surgeMultiplier = 1,
  ): Promise<FareEstimate> {
    await new Promise<void>((r) => setTimeout(r, 120));
    return computeFare(route, option, surgeMultiplier);
  }
}

export const fareService: IFareService = new MockFareService();
