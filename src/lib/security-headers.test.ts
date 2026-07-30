import { describe, expect, it } from "vitest";
import {
  contentSecurityPolicy,
  cspIsEnforced,
  securityHeaderNames,
  withSecurityHeaders,
} from "./security-headers";

describe("withSecurityHeaders", () => {
  it("sets every header on an ordinary response", () => {
    const out = withSecurityHeaders(new Response("<html></html>", { status: 200 }));
    for (const name of securityHeaderNames) {
      expect(out.headers.get(name), name).toBeTruthy();
    }
  });

  it("preserves status, statusText and existing headers", () => {
    const out = withSecurityHeaders(
      new Response("nope", {
        status: 404,
        statusText: "Not Found",
        headers: { "content-type": "text/plain", "set-cookie": "a=1" },
      }),
    );
    expect(out.status).toBe(404);
    expect(out.statusText).toBe("Not Found");
    expect(out.headers.get("content-type")).toBe("text/plain");
    expect(out.headers.get("set-cookie")).toBe("a=1");
  });

  it("keeps the body intact", async () => {
    const out = withSecurityHeaders(new Response("hello", { status: 200 }));
    await expect(out.text()).resolves.toBe("hello");
  });

  it("handles bodyless statuses without throwing", () => {
    // Constructing a Response with a body on 204/304 is a TypeError, so these
    // have to be rebuilt with null — a redirect response would 500 otherwise.
    for (const status of [204, 304]) {
      const out = withSecurityHeaders(new Response(null, { status }));
      expect(out.status).toBe(status);
      expect(out.headers.get("X-Frame-Options")).toBe("DENY");
    }
  });

  it("denies framing, which is what stops clickjacking", () => {
    const out = withSecurityHeaders(new Response("ok"));
    expect(out.headers.get("X-Frame-Options")).toBe("DENY");
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
  });

  it("ships CSP as report-only until reports are clean", () => {
    const out = withSecurityHeaders(new Response("ok"));
    const header = cspIsEnforced
      ? "Content-Security-Policy"
      : "Content-Security-Policy-Report-Only";
    const other = cspIsEnforced ? "Content-Security-Policy-Report-Only" : "Content-Security-Policy";
    expect(out.headers.get(header)).toBe(contentSecurityPolicy);
    expect(out.headers.get(other)).toBeNull();
  });

  it("allows every host the app actually calls", () => {
    // A missing entry here is an outage once CSP is enforced, so it is pinned.
    for (const host of [
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://photon.komoot.io",
      "https://places.googleapis.com",
      "https://maps.googleapis.com",
      "https://api.mapbox.com",
      "https://router.project-osrm.org",
      "https://*.basemaps.cartocdn.com",
    ]) {
      expect(contentSecurityPolicy, host).toContain(host);
    }
  });

  it("locks down the directives that have no legitimate use here", () => {
    expect(contentSecurityPolicy).toContain("object-src 'none'");
    expect(contentSecurityPolicy).toContain("base-uri 'self'");
    expect(contentSecurityPolicy).toContain("form-action 'self'");
  });
});
