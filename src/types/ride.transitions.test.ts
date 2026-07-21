import { describe, expect, it } from "vitest";
import { canTransition, RIDE_STATUS_TRANSITIONS, type RideStatus } from "./ride";

describe("RIDE_STATUS_TRANSITIONS", () => {
  it("allows the happy-path lifecycle", () => {
    expect(canTransition("requested", "accepted")).toBe(true);
    expect(canTransition("accepted", "arrived")).toBe(true);
    expect(canTransition("arrived", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "completed")).toBe(true);
  });

  it("rejects illegal jumps", () => {
    expect(canTransition("requested", "completed")).toBe(false);
    expect(canTransition("requested", "in_progress")).toBe(false);
    expect(canTransition("accepted", "completed")).toBe(false);
    expect(canTransition("arrived", "completed")).toBe(false);
  });

  it("treats completed and cancelled as terminal", () => {
    expect(RIDE_STATUS_TRANSITIONS.completed).toHaveLength(0);
    expect(RIDE_STATUS_TRANSITIONS.cancelled).toHaveLength(0);
  });

  it("allows cancellation from every non-terminal state", () => {
    const nonTerminal: RideStatus[] = [
      "requested",
      "matched",
      "accepted",
      "arrived",
      "in_progress",
    ];
    for (const s of nonTerminal) {
      expect(canTransition(s, "cancelled")).toBe(true);
    }
  });
});
