import appI18n from "@/i18n";
import type { TFunction } from "i18next";

import { GUIDE_KEY } from "./constants";

export const GUIDE_LABEL_KEYS = ["onThisPage", "before", "steps", "knees", "faqs"] as const;
export type GuideLabelKey = (typeof GUIDE_LABEL_KEYS)[number];

export function getGuidesFallbackTranslator(locale: string): TFunction<"guidesFallback"> {
  const fixed = appI18n.getFixedT(locale, "guidesFallback");
  if (typeof fixed === "function") {
    return fixed as TFunction<"guidesFallback">;
  }
  return appI18n.getFixedT("en", "guidesFallback") as TFunction<"guidesFallback">;
}

export function getGuideFallbackLabel(
  translator: TFunction<"guidesFallback">,
  fallbackEn: TFunction<"guidesFallback">,
  key: GuideLabelKey,
): string | undefined {
  const fromLocale = translator(`labels.${key}`, { defaultValue: "" });
  if (typeof fromLocale === "string") {
    const trimmed = fromLocale.trim();
    if (trimmed.length > 0) return trimmed;
  }
  const fromEnglish = fallbackEn(`labels.${key}`, { defaultValue: "" });
  if (typeof fromEnglish === "string") {
    const trimmed = fromEnglish.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return undefined;
}

export function buildGuideFallbackLabels(
  translator: TFunction<"guidesFallback">,
  fallbackEn: TFunction<"guidesFallback">,
): Record<GuideLabelKey, string> {
  return GUIDE_LABEL_KEYS.reduce<Record<GuideLabelKey, string>>((acc, key) => {
    acc[key] = getGuideFallbackLabel(translator, fallbackEn, key) ?? key;
    return acc;
  }, {} as Record<GuideLabelKey, string>);
}

export const TOC_LABEL_KEY_MAP: Record<string, GuideLabelKey> = {
  "toc.before": "before",
  "toc.steps": "steps",
  "toc.knees": "knees",
  "toc.faqs": "faqs",
  tocTitle: "onThisPage",
};

export function buildTranslationKey(suffix: string) {
  return `content.${GUIDE_KEY}.${suffix}`;
}

