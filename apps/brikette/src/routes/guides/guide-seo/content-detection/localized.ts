/**
 * Localized content detection utilities.
 *
 * Determines whether a locale has localized guide content.
 */
import type { AppLanguage } from "@/i18n.config";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import type { Translator } from "../types";

import { isPlaceholderString } from "./placeholders";

interface LocalizedContentParams {
  guideKey: string;
  lang: AppLanguage | undefined;
  resolvedLang: AppLanguage;
  translatorHasStructuredContent: boolean;
  translatorProvidedEmptyStructured: boolean;
  tGuides: Translator;
}

/**
 * Check if intro resource has meaningful content.
 */
function checkIntroMeaningful(introResource: unknown, guideKey: string): boolean {
  try {
    const introValues = ensureStringArray(introResource)
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);
    return introValues.some((value) => !isPlaceholderString(value, `content.${guideKey}.intro`));
  } catch {
    return false;
  }
}

/**
 * Check if sections resource has meaningful content.
 */
function checkSectionsMeaningful(sectionsResource: unknown, guideKey: string): boolean {
  try {
    const arr = ensureArray<{ title?: unknown; body?: unknown; items?: unknown; list?: unknown }>(sectionsResource);
    return arr.some((entry) => {
      if (Array.isArray(entry)) {
        const body = ensureStringArray(entry)
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`));
        return body.length > 0;
      }
      if (!entry || typeof entry !== "object") return false;
      const title = typeof entry.title === "string" ? entry.title.trim() : "";
      const titleMeaningful = title.length > 0 && !isPlaceholderString(title, `content.${guideKey}.sections`);
      const bodyCandidates = [
        ...ensureStringArray(entry.body),
        ...ensureStringArray(entry.items),
        ...ensureStringArray((entry as { list?: unknown }).list),
      ]
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.sections`));
      return titleMeaningful || bodyCandidates.length > 0;
    });
  } catch {
    return false;
  }
}

/**
 * Check if FAQs resource has meaningful content.
 */
function checkFaqsMeaningful(faqsResource: unknown, faqsLegacyResource: unknown, guideKey: string): boolean {
  const toFaqsHasContent = (value: unknown): boolean => {
    const arr = ensureArray<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }>(value);
    return arr.some((faq) => {
      if (!faq || typeof faq !== "object") return false;
      const questionSource =
        typeof faq.q === "string" ? faq.q : typeof faq.question === "string" ? faq.question : "";
      const question = questionSource.trim();
      const answerSource = faq.a ?? faq.answer;
      if (question.length === 0 || isPlaceholderString(question, `content.${guideKey}.faqs`)) {
        return false;
      }
      const answer = ensureStringArray(answerSource)
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .filter((value) => value.length > 0 && !isPlaceholderString(value, `content.${guideKey}.faqs`));
      return answer.length > 0;
    });
  };
  return toFaqsHasContent(faqsResource) || toFaqsHasContent(faqsLegacyResource);
}

/**
 * Check if locale has misc content (tips, warnings) when structured arrays are empty.
 */
function checkHasMiscContent(guideKey: string, tGuides: Translator): boolean {
  const miscKeys: Array<{ key: string; placeholder: string }> = [
    { key: `content.${guideKey}.tips`, placeholder: `content.${guideKey}.tips` },
    { key: `content.${guideKey}.warnings`, placeholder: `content.${guideKey}.warnings` },
  ];
  return miscKeys.some(({ key, placeholder }) => {
    try {
      const raw = tGuides(key, { returnObjects: true } as Record<string, unknown>);
      return ensureStringArray(raw)
        .map((value) => (typeof value === "string" ? value.trim() : ""))
        .some((value) => value.length > 0 && !isPlaceholderString(value, placeholder));
    } catch {
      return false;
    }
  });
}

/**
 * Determine if the locale has localized content.
 */
export function checkHasLocalizedContent({
  guideKey,
  lang,
  resolvedLang,
  translatorHasStructuredContent,
  translatorProvidedEmptyStructured,
  tGuides,
}: LocalizedContentParams): boolean {
  if (!lang) {
    return translatorHasStructuredContent;
  }
  if (translatorHasStructuredContent) {
    return true;
  }

  // When the active translator explicitly returns structured arrays but they
  // are empty (e.g., [] for intro/sections/faqs), treat the locale as
  // unlocalized unless misc content exists.
  if (translatorProvidedEmptyStructured) {
    if (checkHasMiscContent(guideKey, tGuides)) {
      return true;
    }
    return false;
  }

  // Check bundle resources directly
  const introResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.intro`, {
    includeFallback: false,
  });
  const sectionsResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.sections`, {
    includeFallback: false,
  });
  const faqsResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.faqs`, {
    includeFallback: false,
  });
  const faqsLegacyResource = getGuideResource<unknown>(resolvedLang, `content.${guideKey}.faq`, {
    includeFallback: false,
  });

  const introMeaningful = checkIntroMeaningful(introResource, guideKey);
  const sectionsMeaningful = checkSectionsMeaningful(sectionsResource, guideKey);
  const faqsMeaningful = checkFaqsMeaningful(faqsResource, faqsLegacyResource, guideKey);

  return introMeaningful || sectionsMeaningful || faqsMeaningful;
}
