/* eslint-disable ds/no-hardcoded-copy -- DEV-1790: Structured guide fallbacks rely on static copy */
import { useMemo } from "react";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import { getGuideOverrideValue } from "@/config/guide-overrides";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import getFallbackLanguage from "@/routes/guides/utils/getFallbackLanguage";
import { debugGuide, isGuideDebugEnabled } from "@/utils/debug";
import { allowEnglishGuideFallback } from "@/utils/guideFallbackPolicy";
import { ensureStringArray } from "@/utils/i18nContent";

import {
  checkHasLocalizedContent,
  checkHasManualFallback,
  checkTranslatorHasStructuredContent,
  checkTranslatorProvidedEmptyStructured,
  filterPlaceholders,
} from "./content-detection";
import {
  buildTocFromSections,
  fillTocHrefs,
  normalizeFaqs,
  normalizeSections,
  normalizeToc,
} from "./content-normalization";
import type {
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "./types";

interface GuideContentArgs {
  guideKey: GuideKey;
  tGuides: Translator;
  guidesEn: Translator;
  translateGuides?: GenericContentTranslator;
  lang?: AppLanguage;
  /**
   * When true and the active locale lacks localized structured arrays,
   * do not fall back to English structured content for the translator
   * used to shape intro/sections/faqs/baseToc. This allows routes that
   * prefer manual fallbacks for unlocalized locales to avoid accidentally
   * pulling EN content into the visible render path (e.g. ToC/sections),
   * leaving curated guidesFallback logic in charge instead.
   */
  suppressEnglishStructuredWhenUnlocalized?: boolean;
}

interface GuideContentResult {
  contentTranslator: GenericContentTranslator;
  hasLocalizedContent: boolean;
  translatorProvidedEmptyStructured: boolean;
  sections: NormalisedSection[];
  intro: string[];
  faqs: NormalisedFaq[];
  baseToc: TocItem[];
}

export function useGuideContent({
  guideKey,
  tGuides,
  guidesEn,
  translateGuides,
  lang,
  suppressEnglishStructuredWhenUnlocalized = false,
}: GuideContentArgs): GuideContentResult {
  const resolvedLang = (lang ?? getFallbackLanguage()) as AppLanguage;

  // Fetch raw data from translator
  const guideIntroRaw = useMemo(
    () => tGuides(`content.${guideKey}.intro`, { returnObjects: true }),
    [guideKey, tGuides],
  );
  const guideSectionsRaw = useMemo(
    () => tGuides(`content.${guideKey}.sections`, { returnObjects: true }),
    [guideKey, tGuides],
  );
  const guideFaqsRaw = useMemo(
    () => tGuides(`content.${guideKey}.faqs`, { returnObjects: true }),
    [guideKey, tGuides],
  );
  const guideManualFallbackRaw = useMemo(
    () => tGuides(`content.${guideKey}.fallback`, { returnObjects: true }),
    [guideKey, tGuides],
  );

  // Content detection
  const translatorHasStructuredContent = useMemo(
    () =>
      checkTranslatorHasStructuredContent({
        guideKey,
        guideIntroRaw,
        guideSectionsRaw,
        guideFaqsRaw,
      }),
    [guideIntroRaw, guideSectionsRaw, guideFaqsRaw, guideKey],
  );

  const translatorProvidedEmptyStructured = useMemo(
    () =>
      checkTranslatorProvidedEmptyStructured(
        guideIntroRaw,
        guideSectionsRaw,
        guideFaqsRaw,
        translatorHasStructuredContent,
      ),
    [guideFaqsRaw, guideIntroRaw, guideSectionsRaw, translatorHasStructuredContent],
  );

  const hasManualFallback = useMemo(
    () => checkHasManualFallback(guideManualFallbackRaw),
    [guideManualFallbackRaw],
  );

  const hasLocalizedContent = useMemo(
    () =>
      checkHasLocalizedContent({
        guideKey,
        lang,
        resolvedLang,
        translatorHasStructuredContent,
        translatorProvidedEmptyStructured,
        tGuides,
      }),
    [guideKey, resolvedLang, lang, translatorHasStructuredContent, translatorProvidedEmptyStructured, tGuides],
  );

  if (isGuideDebugEnabled()) {
    try {
      debugGuide("useGuideContent: availability", {
        guideKey,
        hasLocalizedContent,
        hasIntroLocal: Array.isArray(guideIntroRaw) && guideIntroRaw.length > 0,
        hasSectionsLocal: Array.isArray(guideSectionsRaw) && guideSectionsRaw.length > 0,
        hasFaqsLocal: Array.isArray(guideFaqsRaw) && guideFaqsRaw.length > 0,
        translatorProvidedEmptyStructured,
      });
    } catch {
      void 0;
    }
  }

  // Resolve content translator
  const contentTranslator = useMemo<GenericContentTranslator>(() => {
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
  }, [
    guidesEn,
    guideKey,
    hasLocalizedContent,
    hasManualFallback,
    resolvedLang,
    suppressEnglishStructuredWhenUnlocalized,
    tGuides,
    translatorHasStructuredContent,
  ]);

  // Normalize sections
  const sections = useMemo<NormalisedSection[]>(() => {
    const primary = contentTranslator(`content.${guideKey}.sections`, { returnObjects: true });
    let out = normalizeSections(primary);

    if (out.length > 0) {
      try {
        debugGuide("useGuideContent baseToC from primary", out);
      } catch {
        void 0;
      }
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

  // Normalize intro
  const intro = useMemo(() => {
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

  // Normalize FAQs
  const faqs = useMemo<NormalisedFaq[]>(() => {
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

  // Normalize base ToC
  const baseToc = useMemo<TocItem[]>(() => {
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
        try {
          debugGuide("useGuideContent baseToC from EN", out);
        } catch {
          void 0;
        }
        return out;
      }
    }

    // Build from sections as last resort
    return buildTocFromSections(sections);
  }, [contentTranslator, guideKey, sections, translateGuides, hasLocalizedContent, resolvedLang]);

  // Debug after baseToc is available
  if (isGuideDebugEnabled()) {
    try {
      debugGuide("useGuideContent: resolved content", {
        guideKey,
        translator: hasLocalizedContent ? "local" : "en",
        counts: { sections: sections.length, intro: intro.length, faqs: faqs.length },
        tocBase: baseToc.length,
      });
    } catch {
      void 0;
    }
  }

  return {
    contentTranslator,
    hasLocalizedContent,
    translatorProvidedEmptyStructured,
    sections,
    intro,
    faqs,
    baseToc,
  };
}
