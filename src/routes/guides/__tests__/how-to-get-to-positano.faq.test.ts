import { beforeEach, describe, expect, it } from "vitest";

import { resetGuideTestState, setTranslations } from "./guides.test-utils";
import { buildGuideFaqFallback } from "../how-to-get-to-positano.faq";

describe("buildGuideFaqFallback", () => {
  beforeEach(() => {
    resetGuideTestState();
  });

  it("prefers structured FAQs when available", () => {
    setTranslations("it", "guides", {
      "content.howToGetToPositano.faqs": [{ q: "How?", a: ["Carefully"] }],
      "content.reachBudget.faqs": [],
    });
    setTranslations("en", "guides", {
      "content.howToGetToPositano.faqs": [],
      "content.reachBudget.faqs": [],
    });

    expect(buildGuideFaqFallback("it")).toEqual([{ q: "How?", a: ["Carefully"] }]);
  });

  it("falls back to legacy keys when structured is empty", () => {
    setTranslations("it", "guides", {
      "content.howToGetToPositano.faqs": [],
      "content.howToGetToPositano.faq": [{ q: "Legacy?", a: ["Old"] }],
      "content.reachBudget.faqs": [],
      "content.reachBudget.faq": [],
    });
    setTranslations("en", "guides", {
      "content.howToGetToPositano.faqs": [],
      "content.howToGetToPositano.faq": [],
      "content.reachBudget.faqs": [],
      "content.reachBudget.faq": [],
    });

    expect(buildGuideFaqFallback("it")).toEqual([{ q: "Legacy?", a: ["Old"] }]);
  });

  it("ultimately uses English fallback and strips link tokens", () => {
    setTranslations("it", "guides", {
      "content.howToGetToPositano.faqs": [],
      "content.howToGetToPositano.faq": [],
      "content.reachBudget.faqs": [],
      "content.reachBudget.faq": [],
    });
    setTranslations("en", "guides", {
      "content.howToGetToPositano.faqs": [{ q: "Fallback", a: ["%LINK:guide|Label%"] }],
      "content.reachBudget.faqs": [],
      "content.reachBudget.faq": [],
    });

    expect(buildGuideFaqFallback("it")).toEqual([{ q: "Fallback", a: ["Label"] }]);
  });
});