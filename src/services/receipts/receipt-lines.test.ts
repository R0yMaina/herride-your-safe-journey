import { describe, expect, it } from "vitest";
import { receiptLines, receiptText } from "./receipt-lines";
import { MockReceiptService, type RideReceipt } from "./receipt.service";

const base: RideReceipt = {
  rideId: "11111111-2222-3333-4444-555555555555",
  status: "completed",
  currency: "KES",
  baseFare: 180,
  distanceCost: 220,
  timeCost: 80,
  bookingFee: 50,
  surgeMultiplier: 1,
  surgeAmount: 0,
  adjustment: 0,
  discount: 0,
  promoCode: null,
  waitingMinutes: 0,
  waitingFee: 0,
  cancellationFee: 0,
  total: 530,
  tip: 0,
  commission: 53,
  driverEarnings: 477,
  distanceKm: 4,
  durationMin: 10,
  driverName: "Grace Wanjiku",
  vehicle: "Toyota Vitz",
  plate: "KDA 100A",
  pickupAddress: "Nairobi CBD",
  dropAddress: "Sarit Centre, Westlands",
  requestedAt: "2026-07-31T08:00:00.000Z",
  completedAt: "2026-07-31T08:25:00.000Z",
};

const sum = (r: RideReceipt) => receiptLines(r).reduce((acc, l) => acc + l.amount, 0);

describe("receiptLines", () => {
  it("adds up to the total on a plain trip", () => {
    expect(sum(base)).toBeCloseTo(base.total, 2);
  });

  it("adds up once a promo discount is applied", () => {
    const r: RideReceipt = { ...base, discount: 100, promoCode: "HERIDE50", total: 430 };
    expect(sum(r)).toBeCloseTo(r.total, 2);
    expect(receiptLines(r).find((l) => l.label === "Promo HERIDE50")?.amount).toBe(-100);
  });

  it("adds up once a busy-period multiplier is applied", () => {
    const r: RideReceipt = { ...base, surgeMultiplier: 1.5, surgeAmount: 240, total: 770 };
    expect(sum(r)).toBeCloseTo(r.total, 2);
    expect(receiptLines(r).find((l) => l.label === "Busy period (1.5x)")?.amount).toBe(240);
  });

  it("prints no surge line at 1.0x, rather than a zero one", () => {
    expect(receiptLines(base).some((l) => l.label.startsWith("Busy period"))).toBe(false);
  });

  it("adds up once a waiting charge is applied", () => {
    const r: RideReceipt = { ...base, waitingMinutes: 8, waitingFee: 25, total: 555 };
    expect(sum(r)).toBeCloseTo(r.total, 2);
    expect(receiptLines(r).some((l) => l.label === "Waiting (8 min)")).toBe(true);
  });

  it("absorbs the minimum-fare floor into the adjustment line", () => {
    // A 0.4 km hop meters below the 150 floor; the adjustment is what makes
    // the printed lines still reconcile with what was actually charged.
    const r: RideReceipt = {
      ...base,
      distanceKm: 0.4,
      distanceCost: 20,
      durationMin: 2,
      timeCost: 10,
      baseFare: 60,
      bookingFee: 50,
      adjustment: 10,
      total: 150,
    };
    expect(sum(r)).toBeCloseTo(r.total, 2);
    expect(receiptLines(r).some((l) => l.label === "Minimum fare adjustment")).toBe(true);
  });

  it("bills a cancelled ride as the fee alone, with no metered fare", () => {
    const r: RideReceipt = { ...base, status: "cancelled", cancellationFee: 100, total: 100 };
    const lines = receiptLines(r);
    expect(lines).toHaveLength(1);
    expect(lines[0].label).toBe("Cancellation fee");
    expect(sum(r)).toBeCloseTo(r.total, 2);
  });

  it("leaves the tip out of the lines — it is paid after settlement", () => {
    const r: RideReceipt = { ...base, tip: 200 };
    expect(sum(r)).toBeCloseTo(r.total, 2);
    expect(receiptLines(r).some((l) => l.label.toLowerCase().includes("tip"))).toBe(false);
  });

  it("reconciles the mock receipt, so mock mode never shows broken arithmetic", async () => {
    const receipt = await new MockReceiptService().getReceipt("mock-ride");
    expect(receipt).not.toBeNull();
    expect(sum(receipt!)).toBeCloseTo(receipt!.total, 2);
  });
});

describe("receiptText", () => {
  it("prints every line, the total, and the ride id", () => {
    const r: RideReceipt = { ...base, discount: 100, promoCode: "HERIDE50", total: 430, tip: 50 };
    const text = receiptText(r, (n) => `KES ${n}`);
    expect(text).toContain("HeRide receipt");
    expect(text).toContain("Base fare: KES 180");
    expect(text).toContain("Promo HERIDE50: KES -100");
    expect(text).toContain("Total charged: KES 430");
    expect(text).toContain("Tip to your driver: KES 50");
    expect(text).toContain(r.rideId);
  });

  it("omits the route and timestamp when they are unknown", () => {
    const r: RideReceipt = { ...base, pickupAddress: null, dropAddress: null, completedAt: null };
    const text = receiptText(r, (n) => `KES ${n}`);
    expect(text).not.toContain("→");
    expect(text).not.toContain("null");
  });
});
