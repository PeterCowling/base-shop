import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import appI18n from "@/i18n";
import {
  createTranslator,
  resetGuideTestState,
  setTranslations,
} from "@/routes/guides/__tests__/guides.test-utils";

const getFixedTSpy = vi.spyOn(appI18n, "getFixedT");
type GetFixedTArgs = Parameters<typeof appI18n.getFixedT>;

function normalizeFixedTArgs(lng: GetFixedTArgs[0], ns: GetFixedTArgs[1]) {
  const locale =
    typeof lng === "string" && lng
      ? lng
      : Array.isArray(lng) && typeof lng[0] === "string"
        ? lng[0]!
        : "en";
  const namespaceCandidate =
    typeof ns === "string" && ns
      ? ns
      : Array.isArray(ns) && typeof ns[0] === "string"
        ? ns[0]!
        : undefined;
  return { locale, namespace: namespaceCandidate ?? "translation" };
}

let getGuidesFallbackTranslator: (typeof import("./i18n"))["getGuidesFallbackTranslator"];
let getGuideFallbackLabel: (typeof import("./i18n"))["getGuideFallbackLabel"];
let buildGuideFallbackLabels: (typeof import("./i18n"))["buildGuideFallbackLabels"];
let buildTranslationKey: (typeof import("./i18n"))["buildTranslationKey"];
let GUIDE_LABEL_KEYS: (typeof import("./i18n"))["GUIDE_LABEL_KEYS"];

beforeAll(async () => {
  ({
    getGuidesFallbackTranslator,
    getGuideFallbackLabel,
    buildGuideFallbackLabels,
    buildTranslationKey,
    GUIDE_LABEL_KEYS,
  } = await import("./i18n"));
});

beforeEach(() => {
  resetGuideTestState();
  setTranslations("en", "guidesFallback", {});
  getFixedTSpy.mockReset();
  getFixedTSpy.mockImplementation((...args: GetFixedTArgs) => {
    const [lng, ns] = args;
    const { locale, namespace } = normalizeFixedTArgs(lng, ns);
    return createTranslator(locale, [namespace], { allowEnglishFallback: false });
  });
});

describe("briketteToFerryDock i18n helpers", () => {
  it("returns the locale specific fallback translator when available", () => {
    setTranslations("it", "guidesFallback", {
      labels: { before: "Prima" },
    });

    const translator = getGuidesFallbackTranslator("it");
    expect(translator("labels.before", { defaultValue: "" })).toBe("Prima");
  });

  it("falls back to english when a translator function is unavailable", () => {
    getFixedTSpy.mockImplementation((...args: GetFixedTArgs) => {
      const [lng, ns] = args;
      const { locale, namespace } = normalizeFixedTArgs(lng, ns);
      if (locale === "fr") {
        return "not-a-function" as unknown as ReturnType<typeof appI18n.getFixedT>;
      }
      return createTranslator(locale, [namespace], { allowEnglishFallback: false });
    });
    setTranslations("en", "guidesFallback", {
      labels: { before: "Before" },
    });

    const translator = getGuidesFallbackTranslator("fr");
    expect(translator("labels.before", { defaultValue: "" })).toBe("Before");
  });

  it("picks the first non-empty translation when building labels", () => {
    setTranslations("it", "guidesFallback", {
      labels: { before: "  prima  ", steps: "   " },
    });
    setTranslations("en", "guidesFallback", {
      labels: { steps: "  fallback  " },
    });

    const translator = getGuidesFallbackTranslator("it");
    const fallbackEn = getGuidesFallbackTranslator("en");

    expect(getGuideFallbackLabel(translator, fallbackEn, "before")).toBe("prima");
    expect(getGuideFallbackLabel(translator, fallbackEn, "steps")).toBe("fallback");
    expect(getGuideFallbackLabel(translator, fallbackEn, "knees")).toBeUndefined();
  });

  it("builds fallback labels for each known key", () => {
    setTranslations("it", "guidesFallback", {
      labels: { onThisPage: "locale" },
    });
    setTranslations("en", "guidesFallback", {
      labels: { before: "enBefore", steps: "enSteps", knees: "enKnees", faqs: "enFaqs" },
    });

    const labels = buildGuideFallbackLabels(
      getGuidesFallbackTranslator("it"),
      getGuidesFallbackTranslator("en"),
    );

    expect(labels.onThisPage).toBe("locale");
    expect(labels.before).toBe("enBefore");
    expect(Object.keys(labels)).toEqual([...GUIDE_LABEL_KEYS]);
  });

  it("builds guide translation keys for the namespace", () => {
    expect(buildTranslationKey("toc.steps")).toBe("content.briketteToFerryDock.toc.steps");
  });
});