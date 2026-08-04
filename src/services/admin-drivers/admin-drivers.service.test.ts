import { describe, expect, it } from "vitest";
import { MockAdminDriversService, type IAdminDriversService } from "./admin-drivers.service";

const service = (): IAdminDriversService => new MockAdminDriversService();

describe("driver application queue", () => {
  it("lists pending applications by default", async () => {
    const s = service();
    const pending = await s.list();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((a) => a.status === "pending")).toBe(true);
  });

  it("moves an application out of the pending queue once approved", async () => {
    const s = service();
    const [first] = await s.list("pending");
    await s.setStatus(first.userId, "verified");

    expect(await s.list("pending")).toHaveLength(0);
    expect((await s.list("verified")).map((a) => a.userId)).toContain(first.userId);
  });

  it("keeps the rejection reason on the application", async () => {
    const s = service();
    const [first] = await s.list("pending");
    await s.setStatus(first.userId, "rejected", "Licence had expired");

    const [rejected] = await s.list("rejected");
    expect(rejected.rejectionReason).toBe("Licence had expired");
  });
});

describe("identity re-check queue", () => {
  it("surfaces the photo she was approved on, not just the new one", async () => {
    // Reviewing the new selfie against the previous re-check would let an
    // account drift to a different face one month at a time.
    const [check] = await service().listPendingChecks();
    expect(check.selfieUrl).toBeTruthy();
    expect(check.verificationSelfieUrl).toBeTruthy();
    expect(check.verificationSelfieUrl).not.toBe(check.selfieUrl);
  });

  it("clears a check off the queue once reviewed", async () => {
    const s = service();
    const [check] = await s.listPendingChecks();
    await s.reviewCheck(check.id, true);
    expect(await s.listPendingChecks()).toHaveLength(0);
  });

  it("clears it on a fail too — a failed check must not sit there forever", async () => {
    const s = service();
    const [check] = await s.listPendingChecks();
    await s.reviewCheck(check.id, false, "Could not match the face");
    expect(await s.listPendingChecks()).toHaveLength(0);
  });

  it("leaves other checks alone", async () => {
    const s = service();
    await s.reviewCheck("some-other-id", true);
    expect(await s.listPendingChecks()).toHaveLength(1);
  });
});
