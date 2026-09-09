import { describe, expect, it } from "vitest";
import { CASE_STUDIES } from "../data/projects";
import { INSIGHTS, INSIGHT_CATEGORIES, readingTime, relatedInsights } from "../data/insights";
import { SERVICES } from "../data/services";
import { PROBLEM_SOLUTIONS } from "../data/problems";
import { FT_ROUTES, NAV_LINKS, FOOTER_COLUMNS } from "../data/site";

const unique = <T>(values: readonly T[]) => new Set(values).size === values.length;

describe("Forgetech content", () => {
  it("has unique slugs", () => {
    expect(unique(CASE_STUDIES.map((p) => p.slug))).toBe(true);
    expect(unique(INSIGHTS.map((a) => a.slug))).toBe(true);
    expect(unique(SERVICES.map((s) => s.id))).toBe(true);
  });

  it("uses only declared article categories", () => {
    for (const article of INSIGHTS) {
      expect(INSIGHT_CATEGORIES).toContain(article.category);
    }
  });

  it("reports a reading time for every article", () => {
    for (const article of INSIGHTS) {
      expect(readingTime(article)).toBeGreaterThan(0);
    }
  });

  it("never suggests an article as related to itself", () => {
    for (const article of INSIGHTS) {
      const related = relatedInsights(article);
      expect(related.map((a) => a.slug)).not.toContain(article.slug);
      expect(related.length).toBeLessThanOrEqual(3);
    }
  });

  it("points every problem at a service that exists", () => {
    const ids = SERVICES.map((service) => service.id);
    for (const item of PROBLEM_SOLUTIONS) {
      expect(ids).toContain(item.serviceId);
    }
  });

  // Guards the rule that matters most on this site: no invented results.
  it("publishes an outcome only when one has been provided", () => {
    for (const project of CASE_STUDIES) {
      expect(project.outcome === null || project.outcome.length > 0).toBe(true);
    }
  });

  it("only links to routes the site actually has", () => {
    const known = Object.values(FT_ROUTES) as string[];
    for (const link of NAV_LINKS) expect(known).toContain(link.to);
    for (const column of FOOTER_COLUMNS) {
      for (const link of column.links) expect(known).toContain(link.to);
    }
  });
});
