import { describe, expect, it } from "vitest";
import { FAQS, faqsFor } from "./faqs";
import { FAQS_SW } from "./faqs.sw";
import { PRIVACY_SECTIONS, privacyFor } from "./privacy";
import { PRIVACY_SECTIONS_SW } from "./privacy.sw";

/**
 * Long-form copy lives in arrays rather than the typed dictionary, so nothing
 * makes the two languages line up at compile time. These tests do it instead:
 * a question answered only in English would otherwise ship unnoticed.
 */
describe("FAQ translations", () => {
  it("answer the same questions, in the same order", () => {
    expect(FAQS_SW.map((f) => f.id)).toEqual(FAQS.map((f) => f.id));
  });

  it("are actually in Swahili, not copies of the English", () => {
    for (const english of FAQS) {
      const swahili = FAQS_SW.find((f) => f.id === english.id);
      expect(swahili?.question).not.toBe(english.question);
      expect(swahili?.answer).not.toBe(english.answer);
    }
  });

  it("quote the same fare figures as the English, not stale hardcoded ones", () => {
    // Both interpolate env.pricing. If one were ever hardcoded, the numbers in
    // its text would drift the moment the pricing config changed.
    const numbers = (text: string) => text.match(/\d+(\.\d+)?/g) ?? [];
    for (const id of ["fare", "cancel"]) {
      const english = FAQS.find((f) => f.id === id)!;
      const swahili = FAQS_SW.find((f) => f.id === id)!;
      expect(numbers(swahili.answer).sort()).toEqual(numbers(english.answer).sort());
    }
  });

  it("have no empty answers", () => {
    for (const faq of FAQS_SW) {
      expect(faq.question.trim()).not.toBe("");
      expect(faq.answer.trim()).not.toBe("");
    }
  });
});

describe("faqsFor", () => {
  it("returns English for English", () => {
    expect(faqsFor("en")).toEqual(FAQS);
  });

  it("returns Swahili for Swahili", () => {
    expect(faqsFor("sw").map((f) => f.question)).toEqual(FAQS_SW.map((f) => f.question));
  });

  it("keeps the English ordering, so the page does not reshuffle on switch", () => {
    expect(faqsFor("sw").map((f) => f.id)).toEqual(FAQS.map((f) => f.id));
  });
});

describe("privacy translations", () => {
  it("cover the same sections", () => {
    expect(PRIVACY_SECTIONS_SW.map((s) => s.id)).toEqual(PRIVACY_SECTIONS.map((s) => s.id));
  });

  it("keep the same number of paragraphs per section", () => {
    // A dropped paragraph in a privacy policy is a dropped disclosure.
    for (const english of PRIVACY_SECTIONS) {
      const swahili = PRIVACY_SECTIONS_SW.find((s) => s.id === english.id);
      expect({ id: english.id, count: swahili?.body.length }).toEqual({
        id: english.id,
        count: english.body.length,
      });
    }
  });

  it("flags the Swahili as a translation, and does not flag the English", () => {
    expect(privacyFor("sw").translationNote).toBeTruthy();
    expect(privacyFor("en").translationNote).toBeNull();
  });
});
