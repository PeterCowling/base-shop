/**
 * Hook to detect localized resources for a target locale.
 *
 * Extracted from _GuideSeoTemplate.tsx to reduce component complexity.
 */
import { useMemo } from "react";

import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

interface Params {
  targetLocale: string | undefined;
  guideKey: string;
  hasLocalizedContent: boolean;
}

/**
 * Check if the target locale has explicit localized content.
 */
export function useHasLocalizedResources({
  targetLocale,
  guideKey,
  hasLocalizedContent,
}: Params): boolean {
  return useMemo(() => {
    if (!targetLocale || targetLocale === "en") {
      return hasLocalizedContent;
    }

    const normalizeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
    const isMeaningful = (value: unknown, placeholder: string): boolean => {
      const normalized = normalizeString(value);
      if (!normalized) return false;
      if (normalized === placeholder) return false;
      if (normalized === guideKey) return false;
      if (normalized.startsWith(`${placeholder}.`)) return false;
      if (normalized.toLowerCase() === "traduzione in arrivo") return false;
      return true;
    };

    // Check intro
    try {
      const intro = getGuideResource<unknown>(targetLocale, `content.${guideKey}.intro`, {
        includeFallback: false,
      });
      const hasIntro = ensureStringArray(intro).some((entry) =>
        isMeaningful(entry, `content.${guideKey}.intro`),
      );
      if (hasIntro) return true;
    } catch {
      /* noop */
    }

    // Check sections
    try {
      const sections = getGuideResource<unknown>(targetLocale, `content.${guideKey}.sections`, {
        includeFallback: false,
      });
      const hasSections = ensureArray(sections).some((entry) => {
        if (Array.isArray(entry)) {
          return ensureStringArray(entry).some((value) =>
            isMeaningful(value, `content.${guideKey}.sections`),
          );
        }
        if (!entry || typeof entry !== "object") return false;
        const record = entry as Record<string, unknown> & { list?: unknown };
        if (isMeaningful(record["title"], `content.${guideKey}.sections`)) return true;
        const bodyCandidates = [
          ...ensureStringArray(record["body"]),
          ...ensureStringArray(record["items"]),
          ...ensureStringArray(record["list"]),
        ];
        return bodyCandidates.some((value) => isMeaningful(value, `content.${guideKey}.sections`));
      });
      if (hasSections) return true;
    } catch {
      /* noop */
    }

    // Check faqs
    try {
      const faqs = getGuideResource<unknown>(targetLocale, `content.${guideKey}.faqs`, {
        includeFallback: false,
      });
      const faqsLegacy = getGuideResource<unknown>(targetLocale, `content.${guideKey}.faq`, {
        includeFallback: false,
      });
      const hasFaqs = (input: unknown): boolean => {
        const entries = ensureArray<{
          q?: unknown;
          question?: unknown;
          a?: unknown;
          answer?: unknown;
        }>(input);
        return entries.some((faq) => {
          if (!faq || typeof faq !== "object") return false;
          const question = normalizeString(faq.q ?? faq.question);
          if (!isMeaningful(question, `content.${guideKey}.faqs`)) return false;
          const answers = ensureStringArray(faq.a ?? faq.answer).map((value) =>
            normalizeString(value),
          );
          return answers.some((answer) => answer.length > 0);
        });
      };
      if (hasFaqs(faqs) || hasFaqs(faqsLegacy)) return true;
    } catch {
      /* noop */
    }

    return hasLocalizedContent;
  }, [targetLocale, guideKey, hasLocalizedContent]);
}
