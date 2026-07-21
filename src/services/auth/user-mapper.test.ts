import { describe, expect, it } from "vitest";
import { resolveRole } from "./user-mapper";

describe("resolveRole", () => {
  it("defaults to passenger with no roles", () => {
    expect(resolveRole([])).toBe("passenger");
    expect(resolveRole(["passenger"])).toBe("passenger");
  });

  it("prefers driver over passenger", () => {
    expect(resolveRole(["passenger", "driver"])).toBe("driver");
  });

  it("prefers admin over everything", () => {
    expect(resolveRole(["passenger", "driver", "admin"])).toBe("admin");
    expect(resolveRole(["admin"])).toBe("admin");
  });
});
