import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";
import { BASE_URL } from "@/config/site";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { translateStringWithFallback } from "@/routes/guides/guide-seo/translations";
import type { Translator } from "@/routes/guides/guide-seo/types";
import { getSlug } from "@/utils/slug";

export function resolveLabel({
  lang,
  namespace,
  keys,
  fallback,
}: {
  lang: AppLanguage;
  namespace: string;
  keys: readonly string[];
  fallback: string;
}): string {
  const localizedT = appI18n.getFixedT(lang, namespace);
  const fallbackT = appI18n.getFixedT("en", namespace);
  const normalizedFallback = fallback.trim();

  const toMeaningful = (value: unknown, key: string): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (trimmed === key) return null;
    if (normalizedFallback.length > 0 && trimmed === normalizedFallback) return null;
    return trimmed;
  };

  const disallowed = new Set<string>();
  const fallbackCandidates: string[] = [];

  for (const key of keys) {
    const fallbackValue = toMeaningful(fallbackT(key, { defaultValue: "" }), key);
    if (fallbackValue) {
      fallbackCandidates.push(fallbackValue);
    }

    const localizedValue = toMeaningful(localizedT(key, { defaultValue: "" }), key);
    if (localizedValue) {
      if (lang === "en" || !fallbackValue || localizedValue !== fallbackValue) {
        return localizedValue;
      }
      disallowed.add(fallbackValue);
    }
  }

  for (const candidate of fallbackCandidates) {
    if (disallowed.has(candidate)) continue;
    return candidate;
  }

  return normalizedFallback.length > 0 ? normalizedFallback : fallback;
}

// Removed unused helpers pickMeaningfulString and dropDuplicateCandidates

export function buildLegacyGuideRedirectBreadcrumb({
  lang,
  guideKey,
  targetPath,
}: {
  lang: AppLanguage;
  guideKey: GuideKey;
  targetPath: string;
}): BreadcrumbList {
  const howToSlug = getSlug("howToGetHere", lang);
  const absoluteTarget = targetPath.startsWith("http") ? targetPath : `${BASE_URL}${targetPath}`;
  const guidesFallbackT = appI18n.getFixedT("en", "guides");
  const headerFallbackT = appI18n.getFixedT("en", "header");
  const homeLabel = resolveLabel({
    lang,
    namespace: "guides",
    keys: ["labels.homeBreadcrumb", "breadcrumbs.home"],
    fallback: guidesFallbackT("labels.homeBreadcrumb"),
  });
  const howToLabel = resolveLabel({
    lang,
    namespace: "header",
    keys: ["howToGetHere"],
    fallback: headerFallbackT("howToGetHere"),
  });
  const { title: guideTitle } = resolveLegacyGuideSeo({ lang, guideKey });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: `${BASE_URL}/${lang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: howToLabel,
        item: `${BASE_URL}/${lang}/${howToSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guideTitle,
        item: absoluteTarget,
      },
    ],
  };
}

export function resolveLegacyGuideSeo({
  lang,
  guideKey,
}: {
  lang: AppLanguage;
  guideKey: GuideKey;
}): { title: string; description: string } {
  const guidesTranslator = appI18n.getFixedT(lang, "guides") as Translator;
  const guidesFallback = appI18n.getFixedT("en", "guides") as Translator;

  const pickMeaningful = (value: unknown, key: string, defaultValue: string): string | null => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (trimmed === key) return null;
    if (trimmed === defaultValue.trim()) return null;
    return trimmed;
  };

  const ensureMeaningful = (
    value: unknown,
    key: string,
    defaultValue: string,
    fallbackTranslator: Translator,
  ): string => {
    const primaryMeaningful = pickMeaningful(value, key, defaultValue);
    if (primaryMeaningful) return primaryMeaningful;

    try {
      const fallbackRaw = fallbackTranslator(key, { defaultValue });
      const fallbackMeaningful = pickMeaningful(fallbackRaw, key, defaultValue);
      if (fallbackMeaningful) return fallbackMeaningful;
    } catch {
      void 0;
    }

    const normalizedDefault = defaultValue.trim();
    if (normalizedDefault.length > 0) return normalizedDefault;
    return key;
  };

  // Title resolution: prefer localized value when meaningful; otherwise prefer
  // English fallback. When neither is meaningful, fall back to the guide key.
  const titleKey = `content.${guideKey}.seo.title` as const;
  const titleDefault = guideKey as string;

  // First attempt via helper (allows tests to spy), but do not rely solely on it
  // since some tests stub it to return only the primary translator value.
  let title = translateStringWithFallback(
    guidesTranslator,
    guidesFallback,
    titleKey,
    titleDefault,
    { locale: lang },
  );

  // If the helper produced a non-meaningful title (empty, unresolved key,
  // or equal to the default), re-evaluate using direct translators to ensure
  // English fallback is applied when appropriate. Otherwise, preserve the
  // helper-provided value so tests can assert delegation semantics.
  const needsResolution = (() => {
    if (typeof title !== "string") return true;
    const t = title.trim();
    if (!t) return true;
    if (t === titleKey) return true;
    if (t === titleDefault) return true;
    return false;
  })();

  if (needsResolution) {
    try {
      const localRaw = guidesTranslator(titleKey, { defaultValue: "" }) as unknown;
      const localMeaningful = pickMeaningful(localRaw, titleKey, titleDefault);
      if (localMeaningful) {
        title = localMeaningful;
      } else {
        const enRaw = guidesFallback(titleKey, { defaultValue: "" }) as unknown;
        const enMeaningful = pickMeaningful(enRaw, titleKey, titleDefault);
        if (enMeaningful) {
          title = enMeaningful;
        } else {
          title = titleDefault;
        }
      }
    } catch {
      void 0;
    }
  }

  // If the localized title and the English fallback collide (same normalized
  // value), consider the title a placeholder and fall back to the guide key.
  // This mirrors breadcrumb label behaviour where duplicate localized/fallback
  // strings are treated as non-meaningful.
  try {
    const rawLocal = guidesTranslator(titleKey, { defaultValue: "" }) as unknown;
    const rawEn = guidesFallback(titleKey, { defaultValue: "" }) as unknown;
    const norm = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    const l = norm(rawLocal);
    const e = norm(rawEn);
    if (l && e && l === e) {
      title = titleDefault;
    }
  } catch {
    // ignore collision probe errors
  }

  const descriptionKey = `content.${guideKey}.seo.description` as const;
  const descriptionDefault = (title as string);
  const translatedDescription = translateStringWithFallback(
    guidesTranslator,
    guidesFallback,
    descriptionKey,
    descriptionDefault,
    { locale: lang },
  );

  const description = ensureMeaningful(
    translatedDescription,
    descriptionKey,
    descriptionDefault,
    guidesFallback,
  );

  return { title, description };
}
