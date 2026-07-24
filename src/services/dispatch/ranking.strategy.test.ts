import { describe, expect, it } from "vitest";
import { NearestFirstRanking } from "./ranking.strategy";
import { haversineKm } from "@/lib/geo";
import type { RideRecord } from "@/types/ride";

const NAIROBI_CBD = { lat: -1.2921, lng: 36.8219 };
const WESTLANDS = { lat: -1.2683, lng: 36.811 };
const KAREN = { lat: -1.3197, lng: 36.7076 };

function ride(id: string, pickup: { lat: number; lng: number }): RideRecord {
  return {
    id,
    passengerId: "p1",
    driverId: null,
    status: "requested",
    pickup: { ...pickup, address: null },
    destination: { lat: 0, lng: 0, address: null },
    fareEstimate: 500,
    fareFinal: null,
    distanceKm: null,
    cancellationReason: null,
    requestedAt: new Date().toISOString(),
    acceptedAt: null,
    startedAt: null,
    completedAt: null,
  };
}

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm(NAIROBI_CBD, NAIROBI_CBD)).toBe(0);
  });

  it("matches known Nairobi distances within tolerance", () => {
    // CBD -> Westlands is roughly 2.9 km straight-line.
    expect(haversineKm(NAIROBI_CBD, WESTLANDS)).toBeGreaterThan(2);
    expect(haversineKm(NAIROBI_CBD, WESTLANDS)).toBeLessThan(4);
    // CBD -> Karen is roughly 13 km straight-line.
    expect(haversineKm(NAIROBI_CBD, KAREN)).toBeGreaterThan(11);
    expect(haversineKm(NAIROBI_CBD, KAREN)).toBeLessThan(15);
  });

  it("is symmetric", () => {
    expect(haversineKm(NAIROBI_CBD, KAREN)).toBeCloseTo(haversineKm(KAREN, NAIROBI_CBD), 10);
  });
});

describe("NearestFirstRanking", () => {
  const strategy = new NearestFirstRanking();

  it("orders rides by pickup distance from the driver", () => {
    const rides = [ride("far", KAREN), ride("near", WESTLANDS)];
    const ranked = strategy.rank(rides, { driverPosition: NAIROBI_CBD });
    expect(ranked.map((r) => r.ride.id)).toEqual(["near", "far"]);
    expect(ranked[0].distanceKm).toBeLessThan(ranked[1].distanceKm ?? Infinity);
  });

  it("preserves pool order when the driver position is unknown", () => {
    const rides = [ride("first", KAREN), ride("second", WESTLANDS)];
    const ranked = strategy.rank(rides, { driverPosition: null });
    expect(ranked.map((r) => r.ride.id)).toEqual(["first", "second"]);
    expect(ranked.every((r) => r.distanceKm === null)).toBe(true);
  });

  it("does not mutate the input pool", () => {
    const rides = [ride("a", KAREN), ride("b", WESTLANDS)];
    strategy.rank(rides, { driverPosition: NAIROBI_CBD });
    expect(rides.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
