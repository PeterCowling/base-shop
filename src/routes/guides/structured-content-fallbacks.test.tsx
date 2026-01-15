import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildGenericContentData } from "@/components/guides/generic-content/buildContent";
import type { GenericContentTranslator } from "@/components/guides/generic-content/types";

const { i18nMock, getFixedTMock } = vi.hoisted(() => {
  const getFixedTMockInner = vi.fn();
  return {
    getFixedTMock: getFixedTMockInner,
    i18nMock: {
      language: "en",
      getFixedT: getFixedTMockInner,
    } as { language: string; getFixedT: typeof getFixedTMockInner },
  };
});

vi.mock("@/i18n", () => ({
  __esModule: true,
  default: i18nMock,
}));

vi.mock("@/utils/debug", () => ({
  debugGuide: vi.fn(),
}));

const makeTranslator = (map: Record<string, unknown>): GenericContentTranslator => {
  return ((key: string, options?: Record<string, unknown>) => {
    const opts = options ?? {};
    if ("returnObjects" in opts && opts.returnObjects) {
      if (key in map) return map[key];
      return [];
    }
    if ("lng" in opts && typeof opts.lng === "string") {
      const localizedKey = `${key}.${opts.lng}`;
      if (localizedKey in map) return map[localizedKey];
    }
    if (key in map) return map[key];
    return key;
  }) as GenericContentTranslator;
};

describe("buildGenericContentData – structured content fallbacks", () => {
  beforeEach(() => {
    i18nMock.language = "en";
    getFixedTMock.mockReset();
  });

  it("falls back to English structured content when the locale is allowed", () => {
    i18nMock.language = "it";

    const englishTranslator = makeTranslator({
      "content.freeThingsPositano.intro": ["English intro"],
      "content.freeThingsPositano.sections": [],
      "content.freeThingsPositano.faqs": [{ q: "When is it quiet?", a: ["Early morning"] }],
      "content.freeThingsPositano.faq": [],
      "content.freeThingsPositano.tips": [],
      "content.freeThingsPositano.warnings": [],
      "labels.faqsHeading": "FAQs",
    });

    getFixedTMock.mockReturnValue(englishTranslator);

    const localizedTranslator = makeTranslator({
      "content.freeThingsPositano.intro": [],
      "content.freeThingsPositano.sections": [],
      "content.freeThingsPositano.faqs": [],
      "content.freeThingsPositano.faq": [],
      "content.freeThingsPositano.tips": [],
      "content.freeThingsPositano.warnings": [],
      "labels.faqsHeading": "FAQs",
    });

    const result = buildGenericContentData(localizedTranslator, "freeThingsPositano");

    expect(getFixedTMock).toHaveBeenCalledWith("en", "guides");
    expect(result).not.toBeNull();
    expect(result?.intro).toEqual(["English intro"]);
    expect(result?.faqs).toEqual([{ q: "When is it quiet?", a: ["Early morning"] }]);
  });

  it("does not fall back to English when the locale is blocklisted", () => {
    i18nMock.language = "ru";

    const localizedTranslator = makeTranslator({
      "content.freeThingsPositano.intro": [],
      "content.freeThingsPositano.sections": [],
      "content.freeThingsPositano.faqs": [],
      "content.freeThingsPositano.faq": [],
      "content.freeThingsPositano.tips": [],
      "content.freeThingsPositano.warnings": [],
    });

    const result = buildGenericContentData(localizedTranslator, "freeThingsPositano");

    expect(getFixedTMock).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("prefers localized structured content when data is present", () => {
    i18nMock.language = "fr";

    const localizedTranslator = makeTranslator({
      "content.freeThingsPositano.intro": ["Bonjour"],
      "content.freeThingsPositano.sections": [{ id: "spot", title: "Endroit", body: ["Visitez tôt"] }],
      "content.freeThingsPositano.faqs": [{ q: "Quand y aller ?", a: ["Au lever du soleil"] }],
      "content.freeThingsPositano.faq": [],
      "content.freeThingsPositano.tips": [],
      "content.freeThingsPositano.warnings": [],
      "labels.faqsHeading": "FAQ",
    });

    const result = buildGenericContentData(localizedTranslator, "freeThingsPositano");

    expect(getFixedTMock).not.toHaveBeenCalled();
    expect(result).not.toBeNull();
    expect(result?.intro).toEqual(["Bonjour"]);
    expect(result?.sections[0]?.title).toBe("Endroit");
    expect(result?.faqs[0]).toEqual({ q: "Quand y aller ?", a: ["Au lever du soleil"] });
  });
});