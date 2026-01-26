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
  // Prefer explicit meta.description when provided by the active locale
  const explicitMetaKey = `meta.${metaKey}.description` as const;
  const localMetaRaw = tGuides(explicitMetaKey) as unknown;
  const localMetaMeaningful =
    typeof localMetaRaw === "string" &&
    localMetaRaw.trim().length > 0 &&
    localMetaRaw.trim() !== explicitMetaKey;
  if (localMetaMeaningful) return (localMetaRaw as string).trim();

  // Try content.seo.description
  const k = `content.${metaKey}.seo.description` as const;
  const localOnly = tGuides(k) as unknown;

  if (typeof localOnly === "string") {
    const localDesc = localOnly.trim();
    if (localDesc.length > 0 && localDesc !== k) {
      // Guard against placeholder strings where a locale mistakenly copies
      // the EN title into description
      try {
        const enTitle = translateStringWithFallback(
          tGuides,
          guidesEn,
          `content.${metaKey}.seo.title`,
          undefined,
          { locale: lang },
        );
        if (typeof enTitle === "string" && enTitle.trim().length > 0 && localDesc === enTitle.trim()) {
          // Locale description matches EN title → ignore and prefer EN description
          try {
            const enDescRaw = guidesEn(k) as unknown;
            if (typeof enDescRaw === "string") {
              const enDesc = enDescRaw.trim();
              if (enDesc.length > 0 && enDesc !== k) return enDesc;
            }
          } catch {
            /* fall back to generic EN handling below */
          }
        } else {
          // Locale description is meaningful and not a placeholder
          return localDesc;
        }
      } catch {
        return localDesc;
      }
    }
  }

  // Allow EN fallback regardless of structured content for blank/unresolved locale values
  if (allowEnglishFallback) {
    const viaT = translateStringWithFallback(tGuides, guidesEn, k, undefined, { locale: lang });
    if (typeof viaT === "string" && viaT.trim().length > 0 && viaT !== k) return viaT;
  }

  // Final fallback: empty string
  return "";
}
