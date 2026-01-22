/**
 * Meta title resolution utilities.
 */
import type { AppLanguage } from "@/i18n.config";

import type { Translator } from "../types";

import { sanitizeMetaTitle } from "./sanitizers";
import { translateStringWithFallback } from "../translations";

interface TitleResolverParams {
  metaKey: string;
  lang: AppLanguage;
  tGuides: Translator;
  guidesEn: Translator;
}

/**
 * Resolve the meta title for a guide page.
 */
export function resolveMetaTitle({
  metaKey,
  lang,
  tGuides,
  guidesEn,
}: TitleResolverParams): string {
  const explicitMetaKey = `meta.${metaKey}.title` as const;

  // Get English meta value for comparison (to avoid using EN as "localized")
  const englishMetaValue =
    lang === "en"
      ? undefined
      : (() => {
          try {
            const candidate = guidesEn(explicitMetaKey) as unknown;
            return typeof candidate === "string" ? candidate.trim() : undefined;
          } catch {
            return undefined;
          }
        })();

  // Try explicit meta key from active locale
  const localMetaRaw = tGuides(explicitMetaKey) as unknown;
  const localMeta = (() => {
    const candidate = sanitizeMetaTitle(localMetaRaw, explicitMetaKey, metaKey);
    if (!candidate) return null;
    // Reject if it matches the English value (indicates untranslated)
    if (englishMetaValue && candidate === englishMetaValue) return null;
    return candidate;
  })();
  if (localMeta) return localMeta;

  // Try content.seo.title from active locale
  const contentKey = `content.${metaKey}.seo.title` as const;
  const localContent = sanitizeMetaTitle(tGuides(contentKey) as unknown, contentKey, metaKey);
  if (localContent) return localContent;

  // Try fallback translation
  const viaT = translateStringWithFallback(tGuides, guidesEn, contentKey, undefined, { locale: lang });
  const fallbackTitle = sanitizeMetaTitle(viaT, contentKey, metaKey);
  if (fallbackTitle) return fallbackTitle;

  // Use English meta as last resort
  const englishMetaFallback = sanitizeMetaTitle(englishMetaValue, explicitMetaKey, metaKey);
  if (englishMetaFallback) return englishMetaFallback;

  return contentKey;
}
