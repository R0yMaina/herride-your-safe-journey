import type { FareEstimate, RideOption, RouteEstimate } from "@/types/ride";
import { pricingService } from "@/services/pricing";
import type { FareBreakdown } from "@/services/pricing";

export interface IFareService {
  estimate(route: RouteEstimate, option: RideOption): Promise<FareEstimate>;
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
export function computeFare(route: RouteEstimate, option: RideOption): FareEstimate {
  return toFareEstimate(
    pricingService.quote({
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
      category: option.id,
      categoryMultiplier: option.baseMultiplier,
    }),
  );
}

class MockFareService implements IFareService {
  async estimate(route: RouteEstimate, option: RideOption): Promise<FareEstimate> {
    await new Promise<void>((r) => setTimeout(r, 120));
    return computeFare(route, option);
  }
}

export const fareService: IFareService = new MockFareService();
