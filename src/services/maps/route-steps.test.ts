import { describe, expect, it } from "vitest";
import {
  HEAVY_TRAFFIC_RATIO,
  isHeavyTraffic,
  normalizeManeuver,
  stripHtml,
  trafficRatio,
} from "./route-steps";

describe("normalizeManeuver", () => {
  it("maps Google's vocabulary", () => {
    expect(normalizeManeuver("turn-slight-left")).toBe("turn-slight-left");
    expect(normalizeManeuver("roundabout-right")).toBe("roundabout");
    expect(normalizeManeuver("ramp-left")).toBe("ramp");
    expect(normalizeManeuver("keep-right")).toBe("fork-right");
  });

  it("maps Mapbox's type + modifier pairs", () => {
    expect(normalizeManeuver("turn slight right")).toBe("turn-slight-right");
    expect(normalizeManeuver("turn sharp left")).toBe("turn-sharp-left");
    expect(normalizeManeuver("fork left")).toBe("fork-left");
    expect(normalizeManeuver("rotary")).toBe("roundabout");
    expect(normalizeManeuver("end of road right")).toBe("turn-right");
  });

  it("reads a u-turn as a u-turn regardless of side", () => {
    expect(normalizeManeuver("uturn")).toBe("uturn");
    expect(normalizeManeuver("uturn-left")).toBe("uturn");
    expect(normalizeManeuver("turn uturn right")).toBe("uturn");
  });

  it("falls back to straight rather than guessing a direction", () => {
    expect(normalizeManeuver(undefined)).toBe("straight");
    expect(normalizeManeuver("")).toBe("straight");
    expect(normalizeManeuver("some-future-maneuver")).toBe("straight");
  });
});

describe("stripHtml", () => {
  it("turns Google's markup into something a driver can read", () => {
    expect(stripHtml("Turn <b>left</b> onto <b>Ngong Rd</b>")).toBe("Turn left onto Ngong Rd");
  });

  it("keeps a space where a block element was", () => {
    expect(stripHtml("Continue<div>Then merge</div>")).toBe("Continue Then merge");
  });

  it("decodes the entities Google actually sends", () => {
    expect(stripHtml("Head&nbsp;east on Haile Selassie&#39;s Ave")).toBe(
      "Head east on Haile Selassie's Ave",
    );
  });
});

describe("trafficRatio", () => {
  it("is null when the provider saw no traffic — not 1", () => {
    // The distinction matters: 1 would let the UI claim clear roads on a
    // router that simply cannot see them.
    expect(trafficRatio({ durationMin: 20 })).toBeNull();
    expect(trafficRatio({ durationMin: 20, freeFlowDurationMin: 0 })).toBeNull();
  });

  it("is the ratio of the real drive to the empty-road one", () => {
    expect(trafficRatio({ durationMin: 30, freeFlowDurationMin: 20 })).toBeCloseTo(1.5, 5);
  });
});

describe("isHeavyTraffic", () => {
  it("says nothing when there is no traffic reading", () => {
    expect(isHeavyTraffic({ durationMin: 45 })).toBe(false);
  });

  it("stays quiet on ordinary congestion", () => {
    expect(isHeavyTraffic({ durationMin: 21, freeFlowDurationMin: 20 })).toBe(false);
  });

  it("speaks up at the threshold", () => {
    const free = 20;
    expect(
      isHeavyTraffic({ durationMin: free * HEAVY_TRAFFIC_RATIO, freeFlowDurationMin: free }),
    ).toBe(true);
  });

  it("does not report heavy traffic on a faster-than-usual run", () => {
    expect(isHeavyTraffic({ durationMin: 15, freeFlowDurationMin: 20 })).toBe(false);
  });
});
