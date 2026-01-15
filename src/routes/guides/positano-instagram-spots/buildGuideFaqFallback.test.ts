import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildGuideFaqFallback } from "./buildGuideFaqFallback";
import type { AppLanguage } from "@/i18n.config";
import * as fallbackModule from "./createFallbackData";
import type { FallbackData } from "./types";

const createFallbackDataSpy = vi.spyOn(fallbackModule, "createFallbackData");

const createFallbackDataset = (overrides: Partial<FallbackData>): FallbackData => ({
  intro: [],
  toc: [],
  gallery: [],
  classics: null,
  alternatives: null,
  sunset: null,
  etiquette: null,
  faqs: null,
  drone: null,
  hasContent: false,
  ...overrides,
});

describe("buildGuideFaqFallback for Positano Instagram spots", () => {
  beforeEach(() => {
    createFallbackDataSpy.mockReset();
  });

  it("returns an empty array when no FAQ data exists", () => {
    const payload: Record<AppLanguage, FallbackData> = {
      ar: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      de: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      en: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      es: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      fr: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      hi: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      it: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      ja: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      ko: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      no: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      da: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      hu: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      pl: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      pt: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      ru: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      sv: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      vi: createFallbackDataset({ faqs: { heading: "", items: [] } }),
      zh: createFallbackDataset({ faqs: { heading: "", items: [] } }),
    };
    createFallbackDataSpy.mockImplementation((lang) => payload[lang]);

    expect(buildGuideFaqFallback("en")).toEqual([]);
    expect(buildGuideFaqFallback("it")).toEqual([]);
  });

  it("normalises questions and strips link tokens from answers", () => {
    createFallbackDataSpy.mockImplementation((lang) =>
      lang === "it"
        ? createFallbackDataset({
            faqs: {
              heading: "FAQs",
              items: [
                { summary: "When is the best time?", body: "<p>%LINK:guide|Anytime%</p>" },
                { summary: null as unknown as string, body: null as unknown as string },
              ],
            },
          })
        : createFallbackDataset({ faqs: { heading: "", items: [] } }),
    );

    expect(buildGuideFaqFallback("it")).toEqual([
      { q: "When is the best time?", a: ["Anytime"] },
      { q: "", a: [""] },
    ]);
  });
});