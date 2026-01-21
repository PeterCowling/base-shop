// src/app/_lib/static-params.ts
// Shared static params generation utilities for App Router
import { type AppLanguage,i18nConfig } from "@/i18n.config";

/**
 * Generate static params for all supported languages.
 * Use in pages that only have a [lang] dynamic segment.
 */
export function generateLangParams(): Array<{ lang: string }> {
  return i18nConfig.supportedLngs.map((lang) => ({ lang }));
}

/**
 * Generate static params for language + another dynamic segment.
 * @param getValues - Function that returns array of values for the second segment
 * @param paramName - Name of the second param (default: "slug")
 */
export function generateLangAndSlugParams<T extends string>(
  getValues: (lang: AppLanguage) => T[],
  paramName = "slug"
): Array<{ lang: string; [key: string]: string }> {
  return i18nConfig.supportedLngs.flatMap((lang) =>
    getValues(lang).map((value) => ({
      lang,
      [paramName]: value,
    }))
  );
}

/**
 * Generate static params for language + id combinations.
 * @param ids - Array of IDs (same across all languages)
 */
export function generateLangAndIdParams(ids: string[]): Array<{ lang: string; id: string }> {
  return i18nConfig.supportedLngs.flatMap((lang) =>
    ids.map((id) => ({ lang, id }))
  );
}
