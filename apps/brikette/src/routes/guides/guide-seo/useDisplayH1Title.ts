// src/routes/guides/guide-seo/useDisplayH1Title.ts
import { useMemo } from "react";

import type { GuideKey } from "@/guides/slugs";
import type { TFunction } from "@/utils/i18nSafe";
import { getOptionalString, getStringWithFallback } from "@/utils/i18nSafe";

type Translations = {
  tGuides: TFunction;
  guidesEn?: TFunction;
  // Allow falling back to translateGuides (bundle/store-aware) when getFixedT
  // is not available in tests.
  translateGuides?: TFunction;
  // Expose active language when available so we can distinguish EN from
  // localized fallbacks in environments where translators auto-fallback.
  lang?: string;
};

// Fallback implementations used when i18n helpers are partially mocked in tests
const FALLBACK_GET_OPTIONAL_STRING: typeof getOptionalString = (
  t: TFunction,
  key: string,
  options?: Record<string, unknown>,
) => {
  try {
    const value = typeof t === "function" ? t(key, options ?? {}) : undefined;
    const s = typeof value === "string" ? value.trim() : "";
    return s && s !== key ? s : undefined;
  } catch {
    return undefined;
  }
};

const FALLBACK_GET_STRING_WITH_FALLBACK: typeof getStringWithFallback = (
  t: TFunction,
  fb: TFunction,
  key: string,
  options?: Record<string, unknown>,
) => {
  try {
    const v1 = typeof t === "function" ? t(key, options ?? {}) : undefined;
    const s1 = typeof v1 === "string" ? v1.trim() : "";
    if (s1 && s1 !== key) return s1;
    const v2 = typeof fb === "function" ? fb(key, options ?? {}) : undefined;
    const s2 = typeof v2 === "string" ? v2.trim() : "";
    return s2 && s2 !== key ? s2 : undefined;
  } catch {
    return undefined;
  }
};

// Guard i18nSafe helpers for partially mocked modules in tests.
const safeGetOptionalString: typeof getOptionalString =
  typeof getOptionalString === "function" ? getOptionalString : FALLBACK_GET_OPTIONAL_STRING;

const safeGetStringWithFallback: typeof getStringWithFallback =
  typeof getStringWithFallback === "function" ? getStringWithFallback : FALLBACK_GET_STRING_WITH_FALLBACK;

// Helper to resolve meta title from meta key
function resolveMetaTitle(
  metaKey: string | undefined,
  translations: Translations,
): {
  metaTitle: string | undefined;
  trimmedMeta: string;
  metaTitleIsPlaceholder: boolean;
  metaTitleIsEnglishFallback: boolean;
} {
  const metaTitleKey = `meta.${metaKey}.title` as const;
  const metaTitleCandidate =
    metaKey ? safeGetOptionalString(translations.tGuides, metaTitleKey) : undefined;
  const metaTitleEn = translations.guidesEn
    ? safeGetOptionalString(translations.guidesEn, metaTitleKey)
    : undefined;
  const trimmedMeta = typeof metaTitleCandidate === "string" ? metaTitleCandidate.trim() : "";
  const metaTitleIsPlaceholder = trimmedMeta.toLowerCase().includes("meta");
  const metaTitleIsEnglishFallback =
    Boolean(trimmedMeta) && metaTitleEn === metaTitleCandidate && (translations.lang ?? "") !== "en";
  const metaTitle =
    metaTitleCandidate && !metaTitleIsPlaceholder && !metaTitleIsEnglishFallback
      ? metaTitleCandidate
      : undefined;

  return { metaTitle, trimmedMeta, metaTitleIsPlaceholder, metaTitleIsEnglishFallback };
}

// Helper to pick localized SEO title
function pickLocalizedSeo(
  key: string | null | undefined,
  translations: Translations,
): string | undefined {
  if (!key) return undefined;
  const candidate = safeGetOptionalString(translations.tGuides, key);
  if (!candidate) return undefined;
  const lang = translations.lang ?? "en";
  if (lang !== "en") {
    const english = translations.guidesEn
      ? safeGetOptionalString(translations.guidesEn, key)
      : undefined;
    if (
      english &&
      english.trim().length > 0 &&
      english.trim().toLowerCase() === candidate.trim().toLowerCase()
    ) {
      return undefined;
    }
  }
  return candidate;
}

// Helper to resolve SEO title
function resolveSeoTitle(
  guideKey: string,
  metaKey: string | undefined,
  translations: Translations,
  hasLocalizedContent: boolean | undefined,
  trimmedMeta: string,
): {
  localizedSeo: string | undefined;
  resolvedSeo: string | undefined;
  normalizedMeta: string;
  normalizedSeo: string;
} {
  const seoKey = `content.${guideKey}.seo.title` as const;
  const altSeoKey = metaKey && metaKey !== guideKey ? (`content.${metaKey}.seo.title` as const) : null;

  const localizedSeo = pickLocalizedSeo(altSeoKey, translations) ?? pickLocalizedSeo(seoKey, translations);

  const resolvedSeo = (() => {
    if (localizedSeo) {
      return localizedSeo;
    }
    if (hasLocalizedContent) {
      return undefined;
    }
    const enGuidesT: TFunction = translations.guidesEn ?? translations.translateGuides ?? translations.tGuides;
    return altSeoKey
      ? (safeGetStringWithFallback(translations.tGuides, enGuidesT, altSeoKey) ||
         safeGetStringWithFallback(translations.tGuides, enGuidesT, seoKey))
      : safeGetStringWithFallback(translations.tGuides, enGuidesT, seoKey);
  })();

  const normalizedMeta = trimmedMeta.toLowerCase();
  const normalizedSeo = typeof resolvedSeo === "string" ? resolvedSeo.trim().toLowerCase() : "";

  return { localizedSeo, resolvedSeo, normalizedMeta, normalizedSeo };
}

// Helper to determine if SEO title should be preferred over meta title
type ShouldPreferSeoOverMetaParams = {
  resolvedSeo: string | undefined;
  metaTitle: string | undefined;
  preferLocalizedSeoTitle: boolean | undefined;
  localizedSeo: string | undefined;
  hasLocalizedContent: boolean | undefined;
  metaTitleIsPlaceholder: boolean;
  metaTitleIsEnglishFallback: boolean;
  normalizedMeta: string;
  normalizedSeo: string;
};

function shouldPreferSeoOverMeta(params: ShouldPreferSeoOverMetaParams): boolean {
  const {
    resolvedSeo,
    metaTitle,
    preferLocalizedSeoTitle,
    localizedSeo,
    hasLocalizedContent,
    metaTitleIsPlaceholder,
    metaTitleIsEnglishFallback,
    normalizedMeta,
    normalizedSeo,
  } = params;
  const preferSeoOverride = Boolean(preferLocalizedSeoTitle && localizedSeo && hasLocalizedContent);

  return Boolean(
    resolvedSeo &&
      (preferSeoOverride ||
        (hasLocalizedContent
          ? (!metaTitle || metaTitleIsPlaceholder || metaTitleIsEnglishFallback ||
              (normalizedMeta && normalizedSeo && normalizedMeta === normalizedSeo))
          : (!metaTitle ||
              (normalizedMeta && normalizedSeo && normalizedMeta === normalizedSeo) ||
              metaTitleIsPlaceholder ||
              metaTitleIsEnglishFallback))),
  );
}

export function useDisplayH1Title(params: {
  metaKey: string | undefined;
  effectiveTitle: string | undefined;
  guideKey: GuideKey;
  translations: Translations;
  // When true, avoid consulting EN fallbacks so tests can assert
  // that no getFixedT calls occur when localized structured content exists.
  hasLocalizedContent?: boolean;
  preferLocalizedSeoTitle?: boolean;
}) {
  const {
    metaKey,
    effectiveTitle,
    guideKey,
    translations,
    hasLocalizedContent,
    preferLocalizedSeoTitle,
  } = params;

  return useMemo(() => {
    const { metaTitle, trimmedMeta, metaTitleIsPlaceholder, metaTitleIsEnglishFallback } = resolveMetaTitle(
      metaKey,
      translations,
    );

    const { localizedSeo, resolvedSeo, normalizedMeta, normalizedSeo } = resolveSeoTitle(
      guideKey,
      metaKey,
      translations,
      hasLocalizedContent,
      trimmedMeta,
    );

    const shouldPreferSeo = shouldPreferSeoOverMeta({
      resolvedSeo,
      metaTitle,
      preferLocalizedSeoTitle,
      localizedSeo,
      hasLocalizedContent,
      metaTitleIsPlaceholder,
      metaTitleIsEnglishFallback,
      normalizedMeta,
      normalizedSeo,
    });

    if (resolvedSeo && shouldPreferSeo) return resolvedSeo;
    if (metaTitle) return metaTitle;
    if (resolvedSeo) return resolvedSeo;

    const titleString = effectiveTitle ?? "";
    return titleString || String(guideKey);
  }, [
    effectiveTitle,
    metaKey,
    translations,
    guideKey,
    hasLocalizedContent,
    preferLocalizedSeoTitle,
  ]);
}
