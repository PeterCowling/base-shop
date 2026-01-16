import { beforeEach, describe, expect, it } from "vitest";

import { resetGuideTestState, setTranslations } from "@/routes/guides/__tests__/guides.test-utils";

import { resolveGuideFaqFallback } from "./guideFaqFallback";
import { getGuidesFallbackTranslator } from "./i18n";
import { GUIDE_KEY } from "./constants";

describe("resolveGuideFaqFallback", () => {
  beforeEach(() => {
    resetGuideTestState();
    setTranslations("it", "guidesFallback", {});
    setTranslations("en", "guidesFallback", {});
  });

  it("returns FAQs from the target language when available", () => {
    setTranslations("ru", "guidesFallback", {
      [`${GUIDE_KEY}.faqs`]: [{ q: "Local Q", a: ["Local A"] }],
    });
    setTranslations("en", "guidesFallback", {
      [`${GUIDE_KEY}.faqs`]: [{ q: "En Q", a: ["En A"] }],
    });

    expect(resolveGuideFaqFallback("ru")).toEqual([{ q: "Local Q", a: ["Local A"] }]);
  });

  it("falls back to legacy FAQ entries when modern ones are empty", () => {
    setTranslations("ru", "guidesFallback", {
      [`${GUIDE_KEY}.faqs`]: [],
      [`${GUIDE_KEY}.faq`]: [{ q: "Legacy Q", a: ["Legacy A"] }],
    });
    setTranslations("en", "guidesFallback", {
      [`${GUIDE_KEY}.faqs`]: [{ q: "En Q", a: ["En A"] }],
    });

    const translator = getGuidesFallbackTranslator("ru");
    expect(translator(`${GUIDE_KEY}.faq`, { returnObjects: true })).toEqual([{ q: "Legacy Q", a: ["Legacy A"] }]);

    expect(resolveGuideFaqFallback("ru")).toEqual([{ q: "Legacy Q", a: ["Legacy A"] }]);
  });

  it("returns English FAQs when locale and legacy entries are empty", () => {
    setTranslations("it", "guidesFallback", {
      [`${GUIDE_KEY}.faqs`]: [],
      [`${GUIDE_KEY}.faq`]: [],
    });
    setTranslations("en", "guidesFallback", {
      [`${GUIDE_KEY}.faqs`]: [{ q: "English", a: ["Answer"] }],
    });

    expect(resolveGuideFaqFallback("it")).toEqual([{ q: "English", a: ["Answer"] }]);
  });
});