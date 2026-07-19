import type { FareEstimate, RideOption, RouteEstimate } from "@/types/ride";

export interface IFareService {
  estimate(route: RouteEstimate, option: RideOption): Promise<FareEstimate>;
}

const round = (n: number) => Math.round(n / 10) * 10;

class MockFareService implements IFareService {
  async estimate(route: RouteEstimate, option: RideOption): Promise<FareEstimate> {
    await new Promise<void>((r) => setTimeout(r, 120));
    const baseFare = round(180 * option.baseMultiplier);
    const distanceCost = round(route.distanceKm * 55 * option.baseMultiplier);
    const timeCost = round(route.durationMin * 8 * option.baseMultiplier);
    const bookingFee = 50;
    const surge = 0;
    const discount = 0;
    const total = baseFare + distanceCost + timeCost + bookingFee + surge - discount;
    return {
      currency: "KES",
      baseFare,
      distanceCost,
      timeCost,
      bookingFee,
      surge,
      discount,
      total,
    };
  }
}

export const fareService: IFareService = new MockFareService();
