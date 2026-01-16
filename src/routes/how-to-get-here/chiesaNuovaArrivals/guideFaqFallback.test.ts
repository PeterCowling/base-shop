import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createTranslator, resetGuideTestState, setTranslations } from "@/routes/guides/__tests__/guides.test-utils";
import { GUIDE_KEY } from "./constants";
import type { GuideFaq } from "./types";

vi.mock("./i18n", async () => {
  const actual = await vi.importActual<typeof import("./i18n")>("./i18n");
  return {
    ...actual,
    getGuidesFallbackTranslator: (locale: string) =>
      createTranslator(locale, ["guidesFallback"], { allowEnglishFallback: false }) as never,
  };
});

let resolveGuideFaqFallback: typeof import("./guideFaqFallback").resolveGuideFaqFallback;

beforeAll(async () => {
  ({ resolveGuideFaqFallback } = await import("./guideFaqFallback"));
});

describe("resolveGuideFaqFallback (chiesaNuovaArrivals)", () => {
  beforeEach(() => {
    resetGuideTestState();
  });

  it("returns localized FAQs when structured content exists", () => {
    const localizedFaqs: GuideFaq[] = [{ q: "Local question", a: ["Localized answer"] }];

    setTranslations("it", "guidesFallback", {
      [GUIDE_KEY]: { faqs: localizedFaqs },
    });
    setTranslations("en", "guidesFallback", {
      [GUIDE_KEY]: { faqs: [{ q: "English question", a: ["English answer"] }] },
    });

    expect(resolveGuideFaqFallback("it")).toEqual(localizedFaqs);
  });

  it("falls back to legacy FAQ entries when modern data is empty", () => {
    const legacyFaqs: GuideFaq[] = [{ q: "Legacy question", a: ["Legacy answer"] }];

    setTranslations("ru", "guidesFallback", {
      [GUIDE_KEY]: {
        faqs: [],
        faq: legacyFaqs,
      },
    });
    setTranslations("en", "guidesFallback", {
      [GUIDE_KEY]: { faqs: [{ q: "English question", a: ["English answer"] }] },
    });

    const translator = createTranslator("ru", ["guidesFallback"], { allowEnglishFallback: false });
    expect(translator(`${GUIDE_KEY}.faqs`, { returnObjects: true })).toEqual([]);
    expect(translator(`${GUIDE_KEY}.faq`, { returnObjects: true })).toEqual(legacyFaqs);

    expect(resolveGuideFaqFallback("ru")).toEqual(legacyFaqs);
  });

  it("uses English fallbacks when both localized collections are empty", () => {
    const englishFaqs: GuideFaq[] = [{ q: "English fallback", a: ["Fallback answer"] }];

    setTranslations("it", "guidesFallback", {
      [GUIDE_KEY]: { faqs: [], faq: [] },
    });
    setTranslations("en", "guidesFallback", {
      [GUIDE_KEY]: { faqs: englishFaqs },
    });

    expect(resolveGuideFaqFallback("it")).toEqual(englishFaqs);
  });
});