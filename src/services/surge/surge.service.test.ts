import { describe, expect, it } from "vitest";
import { computeFare } from "@/services/ride/fare.service";
import type { RideOption, RouteEstimate } from "@/types/ride";
import { NO_SURGE, formatSurge, isSurging } from "./surge.service";

const route: RouteEstimate = { distanceKm: 4, durationMin: 10, polyline: [] };
const option: RideOption = {
  id: "standard",
  name: "HeRide Standard",
  description: "",
  capacity: 4,
  etaMin: 3,
  icon: "sedan",
  baseMultiplier: 1,
};

describe("isSurging", () => {
  it("stays quiet at parity and at noise-level multipliers", () => {
    expect(isSurging(NO_SURGE)).toBe(false);
    expect(isSurging(1.05)).toBe(false);
  });

  it("speaks up from 1.1x", () => {
    expect(isSurging(1.1)).toBe(true);
    expect(isSurging(2)).toBe(true);
  });
});

describe("formatSurge", () => {
  it("shows one decimal, matching what the database rounds to", () => {
    expect(formatSurge(1.4)).toBe("1.4x");
    expect(formatSurge(2)).toBe("2.0x");
  });
});

describe("computeFare under surge", () => {
  it("is unchanged at 1x — the canonical 530 fare still holds", () => {
    expect(computeFare(route, option, 1).total).toBe(530);
  });

  it("charges more at 1.5x", () => {
    const plain = computeFare(route, option, 1);
    const surged = computeFare(route, option, 1.5);
    expect(surged.total).toBeGreaterThan(plain.total);
    expect(surged.surge).toBeGreaterThan(0);
  });

  it("surges the metered fare, not the booking fee", () => {
    // 180 + 220 + 80 = 480 running cost; at 1.5x the surge line is 240.
    expect(computeFare(route, option, 1.5).surge).toBe(240);
    expect(computeFare(route, option, 1.5).bookingFee).toBe(50);
  });

  it("never discounts below the plain fare, whatever it is handed", () => {
    // A bad read must not become a free ride: sub-1 multipliers are floored.
    expect(computeFare(route, option, 0.5).total).toBe(530);
    expect(computeFare(route, option, 0).total).toBe(530);
    expect(computeFare(route, option, -3).total).toBe(530);
  });

  it("defaults to no surge when the caller says nothing", () => {
    expect(computeFare(route, option).total).toBe(computeFare(route, option, 1).total);
  });
});
