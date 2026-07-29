import { describe, expect, it } from "vitest";
import { isValidMapboxToken } from "./env";

/**
 * A structurally valid token, assembled at runtime from harmless parts.
 *
 * Deliberately NOT a literal: a token-shaped string sitting in source is
 * exactly what secret scanners flag, and a test fixture is not worth
 * training anyone to click "allow this secret".
 */
const payload = btoa(JSON.stringify({ u: "test-account", a: "test-token-id" }))
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");
const signature = "0".repeat(22);
const VALID = ["pk", payload, signature].join(".");

describe("isValidMapboxToken", () => {
  it("accepts a well-formed public token", () => {
    expect(VALID.length).toBeGreaterThanOrEqual(60);
    expect(isValidMapboxToken(VALID)).toBe(true);
  });

  it("rejects the dashboard's abbreviated display value", () => {
    // This exact class of value reached production once: a copy of the
    // truncated string a dashboard shows, ellipsis and all.
    expect(isValidMapboxToken("pk.eyJ1IjoiZXhhbXBsZSIs…")).toBe(false);
  });

  it("rejects a token truncated mid-payload", () => {
    expect(isValidMapboxToken(VALID.slice(0, 40))).toBe(false);
  });

  it("rejects a secret token, which must never reach the client", () => {
    expect(isValidMapboxToken(VALID.replace(/^pk/, "sk"))).toBe(false);
  });

  it("rejects empty and whitespace-padded values", () => {
    expect(isValidMapboxToken("")).toBe(false);
    expect(isValidMapboxToken(` ${VALID} `)).toBe(false);
  });

  it("rejects a value missing the signature segment", () => {
    expect(isValidMapboxToken(`pk.${payload}`)).toBe(false);
  });
});
