import { afterEach, describe, expect, it, vi } from "vitest";
import { searchPlaces } from "./geocoding";

/**
 * With no Google or Mapbox keys configured (the vitest env), Photon is the
 * only enlisted provider — which is exactly the deployment shape that
 * produced the "search does nothing" report.
 */
const photonHit = {
  features: [
    {
      geometry: { coordinates: [36.7877, -1.293] },
      properties: { name: "Yaya Centre", city: "Nairobi", country: "Kenya", type: "house" },
    },
  ],
};

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchPlaces", () => {
  it("returns matches and reports the geocoder as available", async () => {
    mockFetch(() => new Response(JSON.stringify(photonHit), { status: 200 }));
    const outcome = await searchPlaces("Yaya Centre");
    expect(outcome.results.map((r) => r.label)).toEqual(["Yaya Centre"]);
    expect(outcome.unavailable).toBe(false);
  });

  it("flags unavailable when the only provider is unreachable", async () => {
    // The real-world failure: the network rejects, so there is nothing to
    // show — but the rider's query was fine and telling her to reword it
    // would send her chasing her own spelling.
    mockFetch(() => Promise.reject(new Error("network down")));
    const outcome = await searchPlaces("Yaya Centre");
    expect(outcome.results).toEqual([]);
    expect(outcome.unavailable).toBe(true);
  });

  it("flags unavailable when the provider returns an error status", async () => {
    mockFetch(() => new Response("rate limited", { status: 429 }));
    const outcome = await searchPlaces("Yaya Centre");
    expect(outcome.unavailable).toBe(true);
  });

  it("does NOT flag unavailable when a reachable provider genuinely has no match", async () => {
    // The distinction the UI hangs off: zero results is not an outage.
    mockFetch(() => new Response(JSON.stringify({ features: [] }), { status: 200 }));
    const outcome = await searchPlaces("qwertyuiop asdfgh");
    expect(outcome.results).toEqual([]);
    expect(outcome.unavailable).toBe(false);
  });

  it("does not call out for queries shorter than three characters", async () => {
    const spy = vi.fn(() => new Response(JSON.stringify(photonHit), { status: 200 }));
    mockFetch(spy);
    const outcome = await searchPlaces("ya");
    expect(spy).not.toHaveBeenCalled();
    expect(outcome).toEqual({ results: [], unavailable: false });
  });
});
