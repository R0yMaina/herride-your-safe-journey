import { describe, expect, it } from "vitest";
import type { TripAnomaly } from "@/services/safety";
import { anomalyCopy, primaryAnomaly } from "./anomaly-copy";

const at = (kind: TripAnomaly["kind"], minsAgo: number, detail = {}): TripAnomaly => ({
  id: `${kind}-${minsAgo}`,
  kind,
  detail,
  createdAt: new Date(Date.now() - minsAgo * 60_000).toISOString(),
});

describe("anomalyCopy", () => {
  it("asks rather than accuses on a deviation", () => {
    const c = anomalyCopy(at("route_deviation", 1));
    expect(c.title).toBe("Is everything okay?");
    expect(c.urgent).toBe(true);
  });

  it("names the number of minutes on a long stop", () => {
    expect(anomalyCopy(at("long_stop", 1, { minutes: 7 })).title).toBe("Stopped for 7 minutes");
  });

  it("degrades to 'several' rather than NaN when the detail is missing", () => {
    expect(anomalyCopy(at("long_stop", 1)).title).toBe("Stopped for several minutes");
    expect(anomalyCopy(at("long_stop", 1, { minutes: "oops" })).title).toContain("several");
  });

  it("keeps a lost signal calm — it is almost always coverage", () => {
    // Crying wolf here would train her to dismiss the prompts that matter.
    expect(anomalyCopy(at("signal_lost", 1)).urgent).toBe(false);
  });

  it("renders something for a kind the server added before the client shipped", () => {
    const future = { ...at("long_stop", 1), kind: "meteor_strike" } as unknown as TripAnomaly;
    expect(anomalyCopy(future).title).toBeTruthy();
  });
});

describe("primaryAnomaly", () => {
  it("returns nothing when there is nothing", () => {
    expect(primaryAnomaly([])).toBeNull();
  });

  it("puts a deviation above a more recent lost signal", () => {
    // Recency must not bury the more serious event.
    const picked = primaryAnomaly([at("signal_lost", 0), at("route_deviation", 10)]);
    expect(picked?.kind).toBe("route_deviation");
  });

  it("ranks long stop above lost signal", () => {
    expect(primaryAnomaly([at("signal_lost", 0), at("long_stop", 5)])?.kind).toBe("long_stop");
  });

  it("breaks ties on the same kind by taking the newest", () => {
    const picked = primaryAnomaly([at("long_stop", 20), at("long_stop", 2)]);
    expect(picked?.id).toBe("long_stop-2");
  });

  it("does not mutate the array it is given", () => {
    const input = [at("signal_lost", 0), at("route_deviation", 10)];
    const before = input.map((a) => a.id);
    primaryAnomaly(input);
    expect(input.map((a) => a.id)).toEqual(before);
  });
});
