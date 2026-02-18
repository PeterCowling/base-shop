// src/routes/guides/guide-seo/contentTranslatorResolver.ts
import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import { getGuideOverrideValue } from "@/config/guide-overrides";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";

import type { Translator } from "./types";

interface ResolveContentTranslatorParams {
  guideKey: GuideKey;
  tGuides: Translator;
  guidesEn: Translator;
  resolvedLang: AppLanguage;
  hasLocalizedContent: boolean;
  hasManualFallback: boolean;
  translatorHasStructuredContent: boolean;
  suppressEnglishStructuredWhenUnlocalized: boolean;
}

export function resolveContentTranslator({
  guideKey,
  tGuides,
  guidesEn,
  resolvedLang,
  hasLocalizedContent,
  hasManualFallback,
  translatorHasStructuredContent,
  suppressEnglishStructuredWhenUnlocalized,
}: ResolveContentTranslatorParams): GenericContentTranslator {
  const allowEnglishFallback = allowEnglishGuideFallback(resolvedLang);

  // Prefer the active locale when structured content exists
  if (hasLocalizedContent || hasManualFallback || translatorHasStructuredContent) {
    return tGuides as GenericContentTranslator;
  }

  // When configured, prefer the active locale translator
  if (getGuideOverrideValue(guideKey as GuideKey, "useActiveTranslatorWhenUnlocalized")) {
    return tGuides as GenericContentTranslator;
  }

  // Never fall back to EN bundles when already EN
  if (resolvedLang === ("en" as AppLanguage)) {
    return guidesEn as GenericContentTranslator;
  }

  // When routes explicitly prefer manual fallbacks, keep active translator
  if (suppressEnglishStructuredWhenUnlocalized) {
    return tGuides as GenericContentTranslator;
  }

  if (!allowEnglishFallback) {
    return tGuides as GenericContentTranslator;
  }

  return guidesEn as GenericContentTranslator;
}
