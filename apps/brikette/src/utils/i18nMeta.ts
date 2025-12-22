import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";

const FALLBACK_LANG = i18nConfig.fallbackLng as AppLanguage;

const normalizeResolvedString = (value: unknown, key: string): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return "";
  }

  if (trimmed === key) {
    return undefined;
  }

  return trimmed;
};

export interface ResolveI18nMetaOptions {
  fallbackLang?: AppLanguage;
}

export interface ResolvedMeta {
  title: string;
  description: string;
}

/**
 * Resolve `meta.title`/`meta.description` for a namespace with graceful
 * fallback to the configured default language when the active locale lacks
 * translated strings. Prevents `<title>meta.title</title>` style leaks.
 */
export function resolveI18nMeta(
  lang: AppLanguage,
  namespace: string,
  options: ResolveI18nMetaOptions = {},
): ResolvedMeta {
  const fallbackLang = options.fallbackLang ?? FALLBACK_LANG;
  const translate = i18n.getFixedT(lang, namespace) as (key: string) => unknown;

  const shouldAttemptFallback = fallbackLang !== lang;
  // Guard: tests may partially mock i18n and omit hasResourceBundle
  const hasResourceBundle = (i18n as unknown as { hasResourceBundle?: unknown })
    ?.hasResourceBundle;
  const fallbackHasBundle =
    shouldAttemptFallback && typeof hasResourceBundle === "function"
      ? (hasResourceBundle as (lng: string, ns: string) => boolean)(fallbackLang, namespace)
      : false;
  const fallbackTranslate = shouldAttemptFallback
    ? (i18n.getFixedT(fallbackLang, namespace) as (key: string) => unknown)
    : undefined;

  const resolveKey = (key: string): string => {
    const value = translate(key);
    const normalized = normalizeResolvedString(value, key);
    if (normalized !== undefined) {
      return normalized;
    }

    let fallbackValue: unknown;
    if (fallbackTranslate) {
      fallbackValue = fallbackTranslate(key);
      const fallbackNormalized = normalizeResolvedString(fallbackValue, key);
      if (fallbackNormalized !== undefined) {
        return fallbackNormalized;
      }
    }

    if (fallbackHasBundle && typeof fallbackValue === "string") {
      return fallbackValue;
    }

    if (typeof value === "string") {
      return value;
    }

    return key;
  };

  return {
    title: resolveKey("meta.title"),
    description: resolveKey("meta.description"),
  };
}
