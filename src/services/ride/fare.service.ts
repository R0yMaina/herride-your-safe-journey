import type { FareEstimate, RideOption, RouteEstimate } from "@/types/ride";

export interface IFareService {
  estimate(route: RouteEstimate, option: RideOption): Promise<FareEstimate>;
}

const round = (n: number) => Math.round(n / 10) * 10;

/**
 * v1 pricing — the single source of truth for fares. Pure and deterministic
 * so it can be unit-tested and, if ever moved server-side, ported verbatim.
 * base 180×mult + 55/km×mult + 8/min×mult + 50 booking fee, KES, rounded to 10.
 */
export function computeFare(route: RouteEstimate, option: RideOption): FareEstimate {
  const baseFare = round(180 * option.baseMultiplier);
  const distanceCost = round(route.distanceKm * 55 * option.baseMultiplier);
  const timeCost = round(route.durationMin * 8 * option.baseMultiplier);
  const bookingFee = 50;
  const surge = 0;
  const discount = 0;
  const total = baseFare + distanceCost + timeCost + bookingFee + surge - discount;
  return { currency: "KES", baseFare, distanceCost, timeCost, bookingFee, surge, discount, total };
}

class MockFareService implements IFareService {
  async estimate(route: RouteEstimate, option: RideOption): Promise<FareEstimate> {
    await new Promise<void>((r) => setTimeout(r, 120));
    return computeFare(route, option);
  }
}

export const fareService: IFareService = new MockFareService();
