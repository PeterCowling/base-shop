// src/routes/guides/guide-seo/useGuideContentNormalizers.ts
import { useMemo } from "react";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { ensureStringArray } from "@/utils/i18nContent";

import { filterPlaceholders } from "./content-detection";
import {
  buildTocFromSections,
  fillTocHrefs,
  normalizeFaqs,
  normalizeSections,
  normalizeToc,
} from "./content-normalization";
import type { NormalisedFaq, NormalisedSection, TocItem } from "./types";

export function useNormalizedSections(
  contentTranslator: GenericContentTranslator,
  translateGuides: GenericContentTranslator | undefined,
  guideKey: GuideKey,
  hasLocalizedContent: boolean,
  resolvedLang: AppLanguage,
): NormalisedSection[] {
  return useMemo<NormalisedSection[]>(() => {
    const primary = contentTranslator(`content.${guideKey}.sections`, { returnObjects: true });
    let out = normalizeSections(primary);

    if (out.length > 0) {
      return out;
    }

    // Fallback to EN when unlocalized
    if (
      !hasLocalizedContent &&
      typeof translateGuides === "function" &&
      resolvedLang !== ("en" as AppLanguage)
    ) {
      const fallback = translateGuides(`content.${guideKey}.sections`, { returnObjects: true });
      out = normalizeSections(fallback);
      if (out.length > 0) return out;
    }

    return out;
  }, [contentTranslator, guideKey, translateGuides, hasLocalizedContent, resolvedLang]);
}

export function useNormalizedIntro(
  contentTranslator: GenericContentTranslator,
  translateGuides: GenericContentTranslator | undefined,
  guideKey: GuideKey,
  hasLocalizedContent: boolean,
  resolvedLang: AppLanguage,
): string[] {
  return useMemo(() => {
    const rawPrimary = contentTranslator(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
    const introKey = `content.${guideKey}.intro`;

    const primary = filterPlaceholders(ensureStringArray(rawPrimary), introKey);
    if (primary.length > 0) return primary;

    // Fallback to EN when unlocalized
    if (
      !hasLocalizedContent &&
      typeof translateGuides === "function" &&
      resolvedLang !== ("en" as AppLanguage)
    ) {
      const fb = translateGuides(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
      const arr =
        Array.isArray(fb) || typeof fb === "string"
          ? filterPlaceholders(ensureStringArray(fb), introKey)
          : [];
      if (arr.length > 0) return arr;
    }

    return primary;
  }, [contentTranslator, guideKey, translateGuides, hasLocalizedContent, resolvedLang]);
}

export function useNormalizedFaqs(
  contentTranslator: GenericContentTranslator,
  translateGuides: GenericContentTranslator | undefined,
  guideKey: GuideKey,
  hasLocalizedContent: boolean,
  resolvedLang: AppLanguage,
): NormalisedFaq[] {
  return useMemo<NormalisedFaq[]>(() => {
    // Prefer localized array form (faqs); fall back to legacy singular (faq)
    const primary = contentTranslator(`content.${guideKey}.faqs`, { returnObjects: true });
    let out = normalizeFaqs(primary, guideKey);
    if (out.length > 0) return out;

    const primaryAlt = contentTranslator(`content.${guideKey}.faq`, { returnObjects: true });
    out = normalizeFaqs(primaryAlt, guideKey);
    if (out.length > 0) return out;

    // Fallback to EN when unlocalized
    if (
      !hasLocalizedContent &&
      typeof translateGuides === "function" &&
      resolvedLang !== ("en" as AppLanguage)
    ) {
      const fb = translateGuides(`content.${guideKey}.faqs`, { returnObjects: true });
      out = normalizeFaqs(fb, guideKey);
      if (out.length > 0) return out;

      const fbAlt = translateGuides(`content.${guideKey}.faq`, { returnObjects: true });
      out = normalizeFaqs(fbAlt, guideKey);
      if (out.length > 0) return out;
    }

    return out;
  }, [contentTranslator, guideKey, translateGuides, hasLocalizedContent, resolvedLang]);
}

export function useNormalizedToc(
  contentTranslator: GenericContentTranslator,
  translateGuides: GenericContentTranslator | undefined,
  guideKey: GuideKey,
  sections: NormalisedSection[],
  hasLocalizedContent: boolean,
  resolvedLang: AppLanguage,
): TocItem[] {
  return useMemo<TocItem[]>(() => {
    const primary = contentTranslator(`content.${guideKey}.toc`, { returnObjects: true });
    let out = normalizeToc(primary);

    if (out.length > 0) {
      return fillTocHrefs(out, sections);
    }

    // Fallback to EN when unlocalized
    if (
      !hasLocalizedContent &&
      typeof translateGuides === "function" &&
      resolvedLang !== ("en" as AppLanguage)
    ) {
      out = normalizeToc(translateGuides(`content.${guideKey}.toc`, { returnObjects: true }));
      if (out.length > 0) {
        return out;
      }
    }

    // Build from sections as last resort
    return buildTocFromSections(sections);
  }, [contentTranslator, guideKey, sections, translateGuides, hasLocalizedContent, resolvedLang]);
}
