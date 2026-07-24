import { describe, expect, it } from "vitest";
import { computeFare } from "./fare.service";
import type { RideOption, RouteEstimate } from "@/types/ride";

const route: RouteEstimate = { distanceKm: 4, durationMin: 10, polyline: [] };
const standard: RideOption = {
  id: "standard",
  name: "Standard",
  description: "",
  capacity: 4,
  etaMin: 5,
  icon: "sedan",
  baseMultiplier: 1,
};

describe("computeFare", () => {
  it("applies the v1 formula for a 1x option", () => {
    const f = computeFare(route, standard);
    // base 180 + dist 4*55=220 + time 10*8=80 + booking 50 = 530
    expect(f.baseFare).toBe(180);
    expect(f.distanceCost).toBe(220);
    expect(f.timeCost).toBe(80);
    expect(f.bookingFee).toBe(50);
    expect(f.total).toBe(530);
    expect(f.currency).toBe("KES");
  });

  it("scales base/distance/time by the option multiplier (not the booking fee)", () => {
    const premium: RideOption = { ...standard, id: "premium", baseMultiplier: 1.5 };
    const f = computeFare(route, premium);
    expect(f.baseFare).toBe(270); // 180*1.5
    expect(f.distanceCost).toBe(330); // 220*1.5
    expect(f.timeCost).toBe(120); // 80*1.5
    expect(f.bookingFee).toBe(50); // flat
    expect(f.total).toBe(270 + 330 + 120 + 50);
  });

  it("rounds component costs to the nearest 10", () => {
    const f = computeFare({ distanceKm: 3.3, durationMin: 7, polyline: [] }, standard);
    // 3.3*55 = 181.5 -> 180 ; 7*8 = 56 -> 60
    expect(f.distanceCost % 10).toBe(0);
    expect(f.timeCost % 10).toBe(0);
  });
});
