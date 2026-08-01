import { describe, expect, it } from "vitest";
import { en } from "./en";
import { sw } from "./sw";
import { translate, type TranslationKey } from "./index";

/** Every dotted leaf path in a dictionary object. */
function leaves(node: unknown, prefix = ""): string[] {
  if (typeof node === "string") return [prefix];
  if (typeof node !== "object" || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    leaves(value, prefix ? `${prefix}.${key}` : key),
  );
}

/** The `{placeholder}` names used in a template. */
function placeholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

function read(dict: unknown, path: string): string {
  let node: unknown = dict;
  for (const part of path.split(".")) node = (node as Record<string, unknown>)[part];
  return node as string;
}

const enKeys = leaves(en);

describe("dictionaries", () => {
  it("cover exactly the same keys", () => {
    // The type system already enforces this; the test states it in the terms a
    // translator would, and catches a `sw.ts` widened by an `any` somewhere.
    expect(leaves(sw).sort()).toEqual([...enKeys].sort());
  });

  it("use the same placeholders in both languages", () => {
    // A Swahili line that drops {count}, or renames it, would render a
    // sentence with a hole in it — and only for Swahili speakers.
    for (const key of enKeys) {
      expect({ key, names: placeholders(read(sw, key)) }).toEqual({
        key,
        names: placeholders(read(en, key)),
      });
    }
  });

  it("has no empty strings", () => {
    for (const key of enKeys) {
      expect(read(en, key).trim()).not.toBe("");
      expect(read(sw, key).trim()).not.toBe("");
    }
  });

  it("actually translates — Swahili is not a copy of English", () => {
    // Guards against a `sw.ts` accidentally re-exporting `en`.
    const differing = enKeys.filter((key) => read(sw, key) !== read(en, key));
    expect(differing.length).toBeGreaterThan(enKeys.length * 0.9);
  });
});

describe("translate", () => {
  it("returns the string for the active language", () => {
    expect(translate("en", "nav.home")).toBe("Home");
    expect(translate("sw", "nav.home")).toBe("Nyumbani");
  });

  it("reaches nested keys", () => {
    expect(translate("sw", "trip.status.arrived")).toBe("Dereva amefika");
  });

  it("substitutes placeholders", () => {
    expect(translate("en", "home.driversNearby", { count: 3 })).toBe("3 drivers nearby");
    expect(translate("sw", "home.driversNearby", { count: 3 })).toBe("Madereva 3 karibu nawe");
  });

  it("leaves an unknown placeholder alone rather than printing undefined", () => {
    expect(translate("en", "home.driversNearby", { other: 1 })).toBe("{count} drivers nearby");
  });

  it("falls back to the key itself when nothing matches, so the bug is visible", () => {
    expect(translate("en", "nope.not.a.key" as TranslationKey)).toBe("nope.not.a.key");
  });

  it("does not treat a non-string node as a translation", () => {
    // "trip.status" is an object; returning "[object Object]" would be worse
    // than showing the key.
    expect(translate("en", "trip.status" as TranslationKey)).toBe("trip.status");
  });
});
