import { describe, expect, it } from "vitest";
import {
  MockRiderVerificationService,
  verificationBlocksBooking,
  type IRiderVerificationService,
  type RiderVerificationState,
} from "./rider-verification.service";

const state = (over: Partial<RiderVerificationState> = {}): RiderVerificationState => ({
  isVerified: false,
  status: "none",
  rejectReason: null,
  submittedAt: null,
  required: true,
  ridesRemaining: 3,
  ...over,
});

describe("verificationBlocksBooking", () => {
  it("never blocks while the requirement is switched off", () => {
    expect(verificationBlocksBooking(state({ required: false, ridesRemaining: 0 }))).toBe(false);
  });

  it("never blocks a verified rider", () => {
    expect(verificationBlocksBooking(state({ isVerified: true, ridesRemaining: 0 }))).toBe(false);
  });

  it("does not block while she still has grace rides", () => {
    expect(verificationBlocksBooking(state({ ridesRemaining: 1 }))).toBe(false);
  });

  it("blocks once the grace is spent", () => {
    expect(verificationBlocksBooking(state({ ridesRemaining: 0 }))).toBe(true);
  });

  it("blocks on a negative remainder, not just exactly zero", () => {
    // The server clamps at zero, but a stale cached state must not read as
    // 'allowed' just because the number went below it.
    expect(verificationBlocksBooking(state({ ridesRemaining: -2 }))).toBe(true);
  });

  it("still blocks a rejected submission — a rejection is not a pass", () => {
    expect(
      verificationBlocksBooking(
        state({ status: "rejected", rejectReason: "Blurry", ridesRemaining: 0 }),
      ),
    ).toBe(true);
  });
});

describe("MockRiderVerificationService", () => {
  it("moves to pending after a submission", async () => {
    // Typed as the interface: screens only ever see it that way, and the mock
    // narrows the signatures it does not need.
    const service: IRiderVerificationService = new MockRiderVerificationService();
    expect((await service.getState()).status).toBe("none");

    const selfie = await service.uploadDocument("selfie", new File([], "s.jpg"));
    const id = await service.uploadDocument("id", new File([], "id.jpg"));
    await service.submit({ selfieUrl: selfie, idDocumentUrl: id });

    const after = await service.getState();
    expect(after.status).toBe("pending");
    expect(after.submittedAt).not.toBeNull();
    expect(after.isVerified).toBe(false);
  });

  it("refuses to review — approving is never a client-side decision", async () => {
    const service: IRiderVerificationService = new MockRiderVerificationService();
    await expect(service.review("id", true)).rejects.toThrow();
  });
});
