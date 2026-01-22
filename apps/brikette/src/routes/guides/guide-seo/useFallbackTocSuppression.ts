/**
 * Hook to determine if fallback ToC should be suppressed.
 *
 * Extracted from _GuideSeoTemplate.tsx to reduce component complexity.
 */
import { useMemo } from "react";
import type { TFunction } from "i18next";

import type { GenericContentTranslator } from "@/components/guides/generic-content/types";

interface Params {
  guideKey: string;
  guidesEn: TFunction | undefined;
  hasLocalizedContent: boolean;
  translateGuides: GenericContentTranslator | undefined;
}

/**
 * Check if the localized fallback ToC should be suppressed.
 */
export function useFallbackTocSuppression({
  guideKey,
  guidesEn,
  hasLocalizedContent,
  translateGuides,
}: Params): boolean {
  return useMemo(() => {
    if (hasLocalizedContent) return false;

    const hasMeaningfulEnglishArray = (value: unknown): boolean =>
      Array.isArray(value) && value.length > 0;

    const englishHasFallbackSections = (value: unknown): boolean => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      const record = value as Record<string, unknown>;
      if (hasMeaningfulEnglishArray(record["toc"])) return true;
      const sections = record["sections"];
      if (!Array.isArray(sections)) return false;
      return sections.some((section) => {
        if (!section || typeof section !== "object") return false;
        const entry = section as Record<string, unknown>;
        const bodyValue = entry["body"];
        const itemsValue = entry["items"];
        const body = Array.isArray(bodyValue)
          ? bodyValue
          : Array.isArray(itemsValue)
          ? itemsValue
          : [];
        return body.some((paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0);
      });
    };

    const resolveEnglishValue = (key: string): unknown => {
      try {
        return guidesEn?.(key, { returnObjects: true } as const);
      } catch {
        return undefined;
      }
    };

    try {
      const translator = translateGuides as
        | ((key: string, options?: Record<string, unknown>) => unknown)
        | undefined;
      if (typeof translator !== "function") return false;

      const checkEmptyArray = (value: unknown): boolean =>
        Array.isArray(value) && value.length === 0;
      const options = { returnObjects: true } as const;
      const primaryKey = `content.${guideKey}.toc` as const;
      const compactKey = `${guideKey}.toc` as const;
      const englishTocHasItems =
        hasMeaningfulEnglishArray(resolveEnglishValue(primaryKey)) ||
        hasMeaningfulEnglishArray(resolveEnglishValue(compactKey));

      if (checkEmptyArray(translator(primaryKey, options)) && !englishTocHasItems) {
        return true;
      }
      if (checkEmptyArray(translator(compactKey, options)) && !englishTocHasItems) {
        return true;
      }

      const fallbackRaw = translator(`content.${guideKey}.fallback`, options);
      if (fallbackRaw && typeof fallbackRaw === "object" && !Array.isArray(fallbackRaw)) {
        const record = fallbackRaw as Record<string, unknown>;
        const englishFallbackHasContent = englishHasFallbackSections(
          resolveEnglishValue(`content.${guideKey}.fallback`),
        );
        if (checkEmptyArray(record["toc"]) && !englishFallbackHasContent) {
          return true;
        }
        const fallbackSections = record["sections"];
        if (
          Array.isArray(fallbackSections) &&
          fallbackSections.length === 0 &&
          !englishFallbackHasContent
        ) {
          return true;
        }
      }
    } catch {
      /* noop */
    }
    return false;
  }, [guideKey, guidesEn, hasLocalizedContent, translateGuides]);
}
