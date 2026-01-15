import { beforeEach, describe, expect, it } from "vitest";

import { resetGuideTestState, setTranslations } from "./guides.test-utils";
import { createGuideFaqFallback } from "../laundry-positano/createGuideFaqFallback";

describe("createGuideFaqFallback", () => {
  beforeEach(() => {
    resetGuideTestState();
  });

  it("returns locale FAQs when available and strips link tokens", () => {
    setTranslations("it", "guides", {
      "content.laundryPositano.faqs": [{ q: "Laundry question?", a: ["Follow %LINK:porterServices|Porters%."] }],
    });
    setTranslations("it", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });
    setTranslations("en", "guides", {
      "content.laundryPositano.faqs": [],
    });
    setTranslations("en", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });

    expect(createGuideFaqFallback("it")).toEqual([{ q: "Laundry question?", a: ["Follow Porters."] }]);
  });

  it("falls back to legacy locale keys when structured FAQs are empty", () => {
    setTranslations("it", "guides", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [{ q: "Legacy question?", a: ["Legacy answer."] }],
    });
    setTranslations("it", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });
    setTranslations("en", "guides", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });
    setTranslations("en", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });

    expect(createGuideFaqFallback("it")).toEqual([{ q: "Legacy question?", a: ["Legacy answer."] }]);
  });

  it("uses English FAQs when locale content is empty", () => {
    setTranslations("it", "guides", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });
    setTranslations("it", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });
    setTranslations("en", "guides", {
      "content.laundryPositano.faqs": [{ q: "English question?", a: ["English answer."] }],
    });
    setTranslations("en", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });

    expect(createGuideFaqFallback("it")).toEqual([{ q: "English question?", a: ["English answer."] }]);
  });

  it("falls back to English legacy FAQs when modern keys are empty", () => {
    setTranslations("it", "guides", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });
    setTranslations("it", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });
    setTranslations("en", "guides", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [{ q: "Legacy EN question?", a: ["Legacy EN answer."] }],
    });
    setTranslations("en", "guidesFallback", {
      "content.laundryPositano.faqs": [],
      "content.laundryPositano.faq": [],
    });

    expect(createGuideFaqFallback("it")).toEqual([{ q: "Legacy EN question?", a: ["Legacy EN answer."] }]);
  });

  it("returns an empty array when no translations provide FAQs", () => {
    setTranslations("it", "guides", {});
    setTranslations("it", "guidesFallback", {});
    setTranslations("en", "guides", {});
    setTranslations("en", "guidesFallback", {});

    expect(createGuideFaqFallback("it")).toEqual([]);
  });
});