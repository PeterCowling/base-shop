// apps/brikette/src/utils/translation-fallback.ts
// Consolidated translation fallback utilities

import { useMemo } from "react";
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { logError } from "@/utils/errors";

/** The configured fallback language as AppLanguage type. */
export const FALLBACK_LANG = i18nConfig.fallbackLng as AppLanguage;

/** Type guard for valid AppLanguage values. */
export function isAppLanguage(input: unknown): input is AppLanguage {
  return (
    typeof input === "string" &&
    (i18nConfig.supportedLngs as readonly string[]).includes(input)
  );
}

/** Coerce any string into a valid AppLanguage, falling back to configured default. */
export function toAppLanguage(input: string | undefined | null): AppLanguage {
  if (isAppLanguage(input)) return input;
  return FALLBACK_LANG;
}

type I18nWithGetFixedT = {
  getFixedT?: (lng: string, ns?: string) => TFunction;
} | null | undefined;

/**
 * Configuration for creating fallback resolvers.
 */
export interface FallbackResolverConfig {
  /** The namespace to use for translations (e.g., "guides", "guidesFallback") */
  namespace: string;
  /** Languages to try in order when resolving translations */
  fallbackChain?: readonly AppLanguage[];
  /** Optional i18n instance to prefer (e.g., from hook) */
  hookI18n?: I18nWithGetFixedT;
}

/**
 * Creates a translator function that tries multiple languages in order.
 * Returns undefined if no translator could be created.
 */
export function getFixedTranslator(
  lang: AppLanguage,
  namespace: string,
  hookI18n?: I18nWithGetFixedT
): TFunction | undefined {
  // Prefer hook-provided i18n for testability
  const fromHook = hookI18n?.getFixedT?.(lang, namespace);
  if (typeof fromHook === "function") return fromHook;

  // Fall back to app-level i18n
  const fromApp = i18n?.getFixedT?.(lang, namespace);
  if (typeof fromApp === "function") return fromApp;

  return undefined;
}

/**
 * Creates an English fallback translator for a namespace.
 * Useful for rendering untranslated content.
 */
export function getEnglishFallbackTranslator(
  namespace: string,
  hookI18n?: I18nWithGetFixedT
): TFunction | undefined {
  return getFixedTranslator("en" as AppLanguage, namespace, hookI18n);
}

/**
 * Resolve a translation value with fallback to English.
 * Returns the translated value, or undefined if not found in any language.
 */
export function resolveWithFallback<T = string>(
  key: string,
  config: FallbackResolverConfig & { activeLang: AppLanguage }
): T | undefined {
  const { namespace, fallbackChain = [FALLBACK_LANG], hookI18n, activeLang } = config;

  // Build ordered list of languages to try
  const languages: AppLanguage[] = [activeLang];
  for (const lang of fallbackChain) {
    if (!languages.includes(lang)) {
      languages.push(lang);
    }
  }

  for (const lang of languages) {
    try {
      const translator = getFixedTranslator(lang, namespace, hookI18n);
      if (!translator) continue;

      const result = translator(key, { returnObjects: true });
      if (result !== undefined && result !== key) {
        return result as T;
      }
    } catch (error) {
      logError(error, {
        scope: "translation-fallback",
        event: "resolveWithFallbackFailed",
        metadata: { key, lang, namespace },
      });
    }
  }

  return undefined;
}

/**
 * Creates a fallback resolver function bound to specific configuration.
 * This is useful for creating reusable translation resolution patterns.
 */
export function createFallbackResolver(config: FallbackResolverConfig) {
  return <T = string>(key: string, activeLang: AppLanguage): T | undefined => {
    return resolveWithFallback<T>(key, { ...config, activeLang });
  };
}

/**
 * Try to get a string value from a translator, returning undefined on failure.
 * Useful for safely extracting string values that may not exist.
 */
export function tryTranslateString(
  translator: TFunction | undefined,
  key: string
): string | undefined {
  if (!translator) return undefined;
  try {
    const result = translator(key);
    return typeof result === "string" && result !== key ? result : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Normalize a language string to its base form (e.g., "en-US" -> "en").
 * Returns undefined if the base is not a supported language.
 */
export function normalizeToSupportedLang(raw: string | undefined): AppLanguage | undefined {
  const trimmed = raw?.toLowerCase();
  if (!trimmed) return undefined;
  const base = trimmed.split("-")[0];
  if (!base) return undefined;
  return isAppLanguage(base) ? base : undefined;
}

/**
 * React hook that memoizes an English fallback translator for a namespace.
 * Replaces the repeated pattern:
 * ```
 * const fallback = useMemo(() => i18n.getFixedT("en", "guides") as TFunction, []);
 * ```
 */
export function useEnglishFallback(namespace: string): TFunction | undefined {
  return useMemo(() => getEnglishFallbackTranslator(namespace), [namespace]);
}

/**
 * Resolve a translation key to a string with an inline fallback.
 * Replaces the repeated pattern:
 * ```
 * (t("key", { defaultValue: "Fallback" }) as string) ?? "Fallback"
 * ```
 */
export function resolveLabel(
  t: TFunction | ((...args: unknown[]) => unknown) | undefined,
  key: string,
  fallback: string
): string {
  if (!t) return fallback;
  try {
    const value = (t as TFunction)(key, { defaultValue: fallback });
    return typeof value === "string" && value.length > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}
