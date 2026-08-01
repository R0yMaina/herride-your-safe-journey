import { describe, expect, it } from "vitest";
import type { RouteStep } from "@/services/maps/route-steps";
import { distanceCue, navigationDeepLink, navigationProgress } from "./navigation";

// Four manoeuvres strung roughly north along a line, ~1.1 km apart.
const steps: readonly RouteStep[] = [
  {
    instruction: "Start off",
    maneuver: "depart",
    distanceKm: 1,
    durationMin: 2,
    at: { lat: 0, lng: 0 },
  },
  {
    instruction: "Turn left",
    maneuver: "turn-left",
    distanceKm: 1,
    durationMin: 2,
    at: { lat: 0.01, lng: 0 },
  },
  {
    instruction: "Turn right",
    maneuver: "turn-right",
    distanceKm: 1,
    durationMin: 2,
    at: { lat: 0.02, lng: 0 },
  },
  {
    instruction: "Arrive",
    maneuver: "arrive",
    distanceKm: 0,
    durationMin: 0,
    at: { lat: 0.03, lng: 0 },
  },
];

describe("navigationProgress", () => {
  it("holds at the first instruction before she has moved", () => {
    const p = navigationProgress(steps, { lat: 0, lng: 0 });
    // She is standing on step 0, so it counts as reached and 1 is next.
    expect(p.step?.instruction).toBe("Turn left");
    expect(p.next?.instruction).toBe("Turn right");
  });

  it("stays on the upcoming turn while she is between manoeuvres", () => {
    const p = navigationProgress(steps, { lat: 0.005, lng: 0 });
    expect(p.step?.instruction).toBe("Turn left");
    expect(p.distanceToStepKm).toBeGreaterThan(0.4);
  });

  it("advances once she reaches a manoeuvre point", () => {
    const p = navigationProgress(steps, { lat: 0.01, lng: 0 });
    expect(p.step?.instruction).toBe("Turn right");
  });

  it("never rewinds to a turn she has already taken", () => {
    // A GPS sample landing behind her must not resurrect step 1.
    const p = navigationProgress(steps, { lat: 0.0, lng: 0 }, 2);
    expect(p.step?.instruction).toBe("Turn right");
    expect(p.index).toBe(2);
  });

  it("clamps to the last step rather than running off the end", () => {
    const p = navigationProgress(steps, { lat: 0.03, lng: 0 }, 3);
    expect(p.step?.instruction).toBe("Arrive");
    expect(p.next).toBeNull();
    expect(p.remaining).toBe(1);
  });

  it("reports nothing for an empty route instead of throwing", () => {
    const p = navigationProgress([], { lat: 0, lng: 0 });
    expect(p.step).toBeNull();
    expect(p.distanceToStepKm).toBeNull();
  });

  it("still names the current step with no fix yet, but no distance", () => {
    const p = navigationProgress(steps, null);
    expect(p.step?.instruction).toBe("Start off");
    expect(p.distanceToStepKm).toBeNull();
  });
});

describe("distanceCue", () => {
  it("says 'now' inside the manoeuvre", () => {
    expect(distanceCue(0.01)).toBe("now");
  });

  it("rounds metres to something readable at a glance", () => {
    expect(distanceCue(0.204)).toBe("in 200 m");
    expect(distanceCue(0.847)).toBe("in 850 m");
  });

  it("switches to km past a kilometre", () => {
    expect(distanceCue(1.24)).toBe("in 1.2 km");
  });

  it("is empty with no fix", () => {
    expect(distanceCue(null)).toBe("");
  });
});

describe("navigationDeepLink", () => {
  it("builds a Google Maps driving link", () => {
    const url = navigationDeepLink({ lat: -1.2921, lng: 36.8219 });
    expect(url).toContain("destination=-1.2921,36.8219");
    expect(url).toContain("travelmode=driving");
  });

  it("builds a Waze link", () => {
    expect(navigationDeepLink({ lat: -1.2921, lng: 36.8219 }, "waze")).toBe(
      "https://waze.com/ul?ll=-1.2921,36.8219&navigate=yes",
    );
  });
});
