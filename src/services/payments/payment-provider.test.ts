import { describe, expect, it } from "vitest";
import { getPaymentProvider, listPaymentMethods } from "./payment-provider";
import { MockPaymentsService } from "./payments.service";

describe("payment provider registry", () => {
  it("exposes all four rails", () => {
    expect([...listPaymentMethods()].sort()).toEqual(["card", "cash", "mpesa", "wallet"]);
  });

  it("marks ledger-backed rails configured and external rails not", () => {
    expect(getPaymentProvider("cash").configured).toBe(true);
    expect(getPaymentProvider("wallet").configured).toBe(true);
    expect(getPaymentProvider("mpesa").configured).toBe(false);
    expect(getPaymentProvider("card").configured).toBe(false);
  });

  it("throws a clear error when an unconfigured rail is used", async () => {
    await expect(
      getPaymentProvider("mpesa").authorize({ rideId: null, method: "mpesa", amount: 500 }),
    ).rejects.toThrow(/not configured/i);
  });
});

describe("MockPaymentsService flow", () => {
  it("captures a wallet intent through authorize + capture", async () => {
    const svc = new MockPaymentsService();
    const intent = await svc.createIntent({ rideId: "r1", method: "wallet", amount: 530 });
    expect(intent.status).toBe("requires_payment");
    const confirmed = await svc.confirm(intent.id);
    expect(confirmed.status).toBe("captured");
    expect(confirmed.amount).toBe(530);
  });

  it("marks an unconfigured rail's intent failed and does not capture", async () => {
    const svc = new MockPaymentsService();
    const intent = await svc.createIntent({ rideId: "r1", method: "mpesa", amount: 530 });
    expect(intent.status).toBe("failed");
  });
});
