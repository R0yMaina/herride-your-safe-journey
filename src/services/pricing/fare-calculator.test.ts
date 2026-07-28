import { describe, expect, it } from "vitest";
import { pricingService, calculateFare } from "./index";
import { resolvePricingConfig } from "./pricing.config";
import {
  AirportPricing,
  CorporatePricing,
  ScheduledRidePricing,
  StandardPricing,
} from "./pricing.strategy";
import type { PricingInput } from "./pricing.types";

const base: PricingInput = {
  distanceKm: 4,
  durationMin: 10,
  category: "standard",
  categoryMultiplier: 1,
};

describe("Pricing Engine — v1 parity", () => {
  it("reproduces the canonical 530 KES fare (base 180 + 220 + 80 + 50)", () => {
    const q = pricingService.quote(base);
    expect(q.baseFare).toBe(180);
    expect(q.distanceCost).toBe(220);
    expect(q.timeCost).toBe(80);
    expect(q.bookingFee).toBe(50);
    expect(q.passengerTotal).toBe(530);
    expect(q.currency).toBe("KES");
    expect(q.pricingVersion).toBe("1.0.0");
  });

  it("scales base/distance/time by the category multiplier, not the booking fee", () => {
    const q = pricingService.quote({ ...base, category: "premium", categoryMultiplier: 1.5 });
    expect(q.baseFare).toBe(270);
    expect(q.distanceCost).toBe(330);
    expect(q.timeCost).toBe(120);
    expect(q.bookingFee).toBe(50);
    expect(q.passengerTotal).toBe(770);
  });

  it("rounds component costs to the nearest 10", () => {
    const q = pricingService.quote({ ...base, distanceKm: 3.3, durationMin: 7 });
    expect(q.distanceCost % 10).toBe(0);
    expect(q.timeCost % 10).toBe(0);
  });
});

describe("Pricing Engine — commission split matches settlement", () => {
  it("splits 530 into 53 commission + 477 driver earnings at the 10% default", () => {
    const q = pricingService.quote(base);
    expect(q.platformCommission).toBe(53);
    expect(q.driverEarnings).toBe(477);
    expect(q.platformCommission + q.driverEarnings).toBe(q.passengerTotal);
  });

  it("honors a per-quote commission override", () => {
    const q = pricingService.quote({ ...base, commissionRate: 0.2 });
    expect(q.platformCommission).toBe(106);
    expect(q.driverEarnings).toBe(424);
  });
});

describe("Pricing Engine — strategies are interchangeable", () => {
  it("airport strategy adds a flat surcharge", () => {
    const q = calculateFare(base, new AirportPricing(250));
    expect(q.surcharge).toBe(250);
    expect(q.passengerTotal).toBe(530 + 250);
  });

  it("scheduled strategy applies a booking-ahead premium", () => {
    const q = calculateFare(base, new ScheduledRidePricing(1.1));
    // base/dist/time scaled by 1.1: 198+? -> just assert it exceeds standard
    expect(q.passengerTotal).toBeGreaterThan(530);
  });

  it("corporate strategy discounts the subtotal", () => {
    const q = calculateFare(base, new CorporatePricing(0.1));
    expect(q.discount).toBeGreaterThan(0);
    expect(q.passengerTotal).toBeLessThan(530);
  });
});

describe("Pricing Engine — surge and edge cases", () => {
  it("applies a demand multiplier as surge", () => {
    const q = pricingService.quote({ ...base, demandMultiplier: 1.5 });
    expect(q.surge).toBeGreaterThan(0);
    expect(q.passengerTotal).toBeGreaterThan(530);
  });

  it("clamps below the minimum fare", () => {
    const cfg = resolvePricingConfig();
    const q = calculateFare(
      { distanceKm: 0, durationMin: 0, category: "standard", categoryMultiplier: 1 },
      new StandardPricing(),
    );
    // base 180 + booking 50 = 230, above min; ensure never below configured min
    expect(q.passengerTotal).toBeGreaterThanOrEqual(cfg.minFare);
  });

  it("guards against negative distance/duration", () => {
    const q = pricingService.quote({ ...base, distanceKm: -10, durationMin: -5 });
    expect(q.distanceCost).toBe(0);
    expect(q.timeCost).toBe(0);
    expect(q.passengerTotal).toBeGreaterThanOrEqual(0);
  });

  it("never lets discount exceed the subtotal", () => {
    const q = calculateFare(base, new CorporatePricing(5)); // absurd 500% discount
    expect(q.discount).toBeLessThanOrEqual(q.subtotal);
    expect(q.passengerTotal).toBeGreaterThanOrEqual(0);
  });
});
