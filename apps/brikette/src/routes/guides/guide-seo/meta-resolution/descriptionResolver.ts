/**
 * Meta description resolution utilities.
 */
import type { AppLanguage } from "@/i18n.config";

import { translateStringWithFallback } from "../translations";
import type { Translator } from "../types";

interface DescriptionResolverParams {
  metaKey: string;
  lang: AppLanguage;
  tGuides: Translator;
  guidesEn: Translator;
  allowEnglishFallback: boolean;
}

/**
 * Resolve the meta description for a guide page.
 */
export function resolveMetaDescription({
  metaKey,
  lang,
  tGuides,
  guidesEn,
  allowEnglishFallback,
}: DescriptionResolverParams): string {
  const pickMeaningful = (value: unknown, keyExpect: string): string => {
    const s = typeof value === "string" ? value.trim() : "";
    if (!s) return "";
    return s !== keyExpect ? s : "";
  };

  const safeTranslate = (key: string): string => {
    try {
      const v = translateStringWithFallback(tGuides, guidesEn, key, undefined, { locale: lang });
      return typeof v === "string" ? v.trim() : "";
    } catch {
      return "";
    }
  };

  const safeGuidesEn = (key: string): string => {
    try {
      const v = guidesEn(key) as unknown;
      return typeof v === "string" ? v.trim() : "";
    } catch {
      return "";
    }
  };

  // Prefer explicit meta.description when provided by the active locale
  const explicitMetaKey = `meta.${metaKey}.description` as const;
  const localMeta = pickMeaningful(tGuides(explicitMetaKey) as unknown, explicitMetaKey);
  if (localMeta) return localMeta;

  // Try content.seo.description
  const k = `content.${metaKey}.seo.description` as const;
  const localDesc = pickMeaningful(tGuides(k) as unknown, k);
  if (localDesc) {
    // Guard against placeholder strings where a locale mistakenly copies
    // the EN title into description.
    const enTitle = safeTranslate(`content.${metaKey}.seo.title`);
    if (!enTitle || localDesc !== enTitle) return localDesc;

    // Locale description matches EN title → ignore and prefer EN description if available.
    const enDesc = pickMeaningful(safeGuidesEn(k), k);
    if (enDesc) return enDesc;
  }

  // Allow EN fallback regardless of structured content for blank/unresolved locale values
  if (allowEnglishFallback) {
    const viaT = pickMeaningful(safeTranslate(k), k);
    if (viaT) return viaT;
  }

  // Final fallback: empty string
  return "";
}
