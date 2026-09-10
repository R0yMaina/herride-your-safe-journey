import { describe, expect, it } from "vitest";
import { projectBriefSchema } from "@/components/forms/projectBrief.schema";

const valid = {
  name: "Amina",
  email: "amina@example.com",
  company: "",
  need: "Website" as const,
  details: "We need a booking site for a clinic, with staff scheduling behind it.",
};

describe("project brief validation", () => {
  it("accepts a brief with no budget selected", () => {
    // react-hook-form reports an unselected radio group as null. This used to
    // fail `.optional()`, which blocked submission with no visible error —
    // the exact opposite of "budget must not create friction".
    const result = projectBriefSchema.safeParse({ ...valid, budget: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBeUndefined();
  });

  it("accepts a brief with a budget selected", () => {
    const result = projectBriefSchema.safeParse({ ...valid, budget: "KSh 500,000+" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBe("KSh 500,000+");
  });

  it("treats a blank company as absent rather than empty", () => {
    const result = projectBriefSchema.safeParse({ ...valid, company: "   " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.company).toBeUndefined();
  });

  it("never shows a visitor a raw enum error", () => {
    const result = projectBriefSchema.safeParse({ ...valid, need: null });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues.find((i) => i.path[0] === "need")?.message;
      expect(message).toBe("Pick the closest option");
      expect(message).not.toMatch(/Expected|received/);
    }
  });

  it("requires a usable name, email and description", () => {
    const result = projectBriefSchema.safeParse({
      name: "",
      email: "not-an-email",
      details: "too short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((issue) => issue.path[0]);
      expect(fields).toEqual(expect.arrayContaining(["name", "email", "need", "details"]));
    }
  });
});
