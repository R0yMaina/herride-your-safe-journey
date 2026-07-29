import { describe, expect, it } from "vitest";
import { rankResults, type RankableResult } from "./result-ranking";

const NAIROBI = { lat: -1.2921, lng: 36.8219 };

const r = (label: string, lat: number, lng: number, kind?: string): RankableResult => ({
  label,
  address: label,
  coords: { lat, lng },
  kind,
});

describe("rankResults", () => {
  it("puts a specific place above a broad area", () => {
    // The exact failure riders reported: searching a mall and being offered
    // the whole city instead.
    const ranked = rankResults(
      [r("Nairobi", -1.2864, 36.8172, "city"), r("Yaya Centre", -1.293, 36.7877, "mall")],
      NAIROBI,
    );
    expect(ranked[0].label).toBe("Yaya Centre");
  });

  it("still returns broad areas when nothing specific matched", () => {
    const ranked = rankResults([r("Nairobi", -1.2864, 36.8172, "city")], NAIROBI);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].label).toBe("Nairobi");
  });

  it("prefers the nearby namesake over a distant one", () => {
    const ranked = rankResults(
      [
        r("Two Rivers Mall", 36.538, -87.367), // Clarksville, USA
        r("Two Rivers Mall", -1.2107, 36.7952), // Nairobi
      ],
      NAIROBI,
    );
    expect(ranked[0].coords.lat).toBeCloseTo(-1.2107, 3);
  });

  it("collapses the same place returned by two providers", () => {
    const ranked = rankResults([
      r("Yaya Centre", -1.293069, 36.787752, "mall"),
      r("yaya centre", -1.29307, 36.78776, "poi"),
    ]);
    expect(ranked).toHaveLength(1);
  });

  it("keeps provider order when nothing distinguishes results", () => {
    const ranked = rankResults([r("First", -1.29, 36.82), r("Second", -1.29, 36.82)]);
    expect(ranked.map((x) => x.label)).toEqual(["First", "Second"]);
  });

  it("caps the list so the sheet stays scannable", () => {
    const many = Array.from({ length: 12 }, (_, i) => r(`Place ${i}`, -1.29 + i / 1000, 36.82));
    expect(rankResults(many, NAIROBI, 6)).toHaveLength(6);
  });
});
