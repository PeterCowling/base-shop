/* eslint-disable ds/no-hardcoded-copy -- DEV-1790: Structured guide fallbacks rely on static copy */
import { useMemo } from "react";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import getFallbackLanguage from "@/routes/guides/utils/getFallbackLanguage";
import { debugGuide, isGuideDebugEnabled } from "@/utils/debug";

import {
  checkHasLocalizedContent,
  checkHasManualFallback,
  checkTranslatorHasStructuredContent,
  checkTranslatorProvidedEmptyStructured,
} from "./content-detection";
import { resolveContentTranslator } from "./contentTranslatorResolver";
import type {
  NormalisedFaq,
  NormalisedSection,
  TocItem,
  Translator,
} from "./types";
import {
  useNormalizedFaqs,
  useNormalizedIntro,
  useNormalizedSections,
  useNormalizedToc,
} from "./useGuideContentNormalizers";

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
    return resolveContentTranslator({
      guideKey,
      tGuides,
      guidesEn,
      resolvedLang,
      hasLocalizedContent,
      hasManualFallback,
      translatorHasStructuredContent,
      suppressEnglishStructuredWhenUnlocalized,
    });
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
  const sections = useNormalizedSections(
    contentTranslator,
    translateGuides,
    guideKey,
    hasLocalizedContent,
    resolvedLang,
  );

  // Normalize intro
  const intro = useNormalizedIntro(
    contentTranslator,
    translateGuides,
    guideKey,
    hasLocalizedContent,
    resolvedLang,
  );

  // Normalize FAQs
  const faqs = useNormalizedFaqs(
    contentTranslator,
    translateGuides,
    guideKey,
    hasLocalizedContent,
    resolvedLang,
  );

  // Normalize base ToC
  const baseToc = useNormalizedToc(
    contentTranslator,
    translateGuides,
    guideKey,
    sections,
    hasLocalizedContent,
    resolvedLang,
  );

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
