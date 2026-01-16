import { beforeEach, describe, expect, it } from "vitest";

import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import type { AppLanguage } from "@/i18n.config";
import {
  createTranslator,
  resetGuideTestState,
  setTranslations,
} from "@/routes/guides/__tests__/guides.test-utils";

import { createGuideLabelReader } from "./labels";
import { buildGuideFallbackLabels, TOC_LABEL_KEY_MAP } from "./i18n";
import { GUIDE_KEY } from "./constants";

const buildContext = (lang: AppLanguage = "it"): GuideSeoTemplateContext => ({
  lang,
  translateGuides: createTranslator(lang, ["guides"]),
  translator: createTranslator(lang, ["guides"]),
  guideKey: GUIDE_KEY,
  metaKey: GUIDE_KEY,
  hasLocalizedContent: true,
  sections: [],
  intro: [],
  faqs: [],
  toc: [],
  ogImage: { url: "", width: 0, height: 0 },
  article: { title: "", description: "" },
  canonicalUrl: "",
});

const buildFallbackLabels = () =>
  buildGuideFallbackLabels(
    createTranslator("it", ["guidesFallback"]),
    createTranslator("en", ["guidesFallback"]),
  );

describe("ferryDockToBrikette labels", () => {
  beforeEach(() => {
    resetGuideTestState();
    setTranslations("it", "guides", {});
    setTranslations("en", "guides", {});
    setTranslations("it", "guidesFallback", {});
    setTranslations("en", "guidesFallback", {});
  });

  it("returns trimmed primary translations when available", () => {
    setTranslations("it", "guides", {
      [`content.${GUIDE_KEY}.primary`]: "  Primary label  ",
    });

    const reader = createGuideLabelReader(buildContext("it"), buildFallbackLabels());

    expect(reader("primary")).toBe("Primary label");
  });

  it("prefers localized fallback values before english ones", () => {
    setTranslations("it", "guides", {
      [`content.${GUIDE_KEY}.localOnly`]: `content.${GUIDE_KEY}.localOnly`,
    });
    setTranslations("fr", "guidesFallback", {
      [`${GUIDE_KEY}.localOnly`]: "  Locale  ",
    });
    setTranslations("en", "guidesFallback", {
      [`${GUIDE_KEY}.localOnly`]: "  English  ",
    });

    const reader = createGuideLabelReader(buildContext("fr"), buildFallbackLabels());

    expect(reader("localOnly")).toBe("Locale");
  });

  it("falls back to english and then mapped labels when translations are empty", () => {
    setTranslations("es", "guides", {
      [`content.${GUIDE_KEY}.toc.before`]: `content.${GUIDE_KEY}.toc.before`,
      [`content.${GUIDE_KEY}.toc.steps`]: "   ",
    });
    setTranslations("es", "guidesFallback", {
      [`${GUIDE_KEY}.toc.steps`]: "   ",
    });
    setTranslations("en", "guidesFallback", {
      [`${GUIDE_KEY}.toc.steps`]: "  English fallback  ",
    });

    const reader = createGuideLabelReader(buildContext("es"), buildFallbackLabels());

    expect(reader("toc.steps")).toBe("English fallback");
    expect(reader("toc.before")).toBe(TOC_LABEL_KEY_MAP["toc.before"]);
    expect(reader("unknown")).toBeUndefined();
  });
});