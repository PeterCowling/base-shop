// src/routes/guides/utils/getGuideResource.ts
import i18n from "@/i18n";
import { getGuidesBundle } from "@/locales/guides";

import getFallbackLanguage from "./getFallbackLanguage";

// i18next v24 may not expose getResource/getFixedT in all builds. Define an
// interface for the runtime shape we need and cast once to avoid repeated
// double-casts throughout the function body.
interface I18nRuntime {
  language?: string;
  getResource?: (lng: string, ns: string, key: string) => unknown;
  getFixedT?: (lng: string, ns?: string) => ((key: string, opts?: { returnObjects?: boolean }) => unknown) | undefined;
}

// Resolve a dotted guides key from an object bundle
function readFromBundle<T = unknown>(bundle: unknown, key: string): T | undefined {
  if (!bundle || typeof bundle !== "object") return undefined;
  const parts = key.split(".");
  let cursor: unknown = bundle as Record<string, unknown>;
  for (const part of parts) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor as T | undefined;
}

interface GetGuideResourceOptions {
  /**
   * When false, only return resources defined for the requested `lang`.
   * Skip falling back to the app's fallback language. Defaults to true.
   */
  includeFallback?: boolean;
}

function isMissingTranslationValue<T>(value: T | null | undefined, key: string): boolean {
  return typeof value === "undefined" || (typeof value === "string" && value === key);
}

function readFromI18nStore<T>(
  instance: I18nRuntime,
  effectiveLang: string,
  fallbackLang: string,
  key: string,
  includeFallback: boolean,
): T | null | undefined {
  if (typeof instance.getResource !== "function") return undefined;
  const localized = instance.getResource(effectiveLang, "guides", key) as T | null | undefined;
  if (localized === null) return null;
  if (!isMissingTranslationValue(localized, key)) return localized;
  if (!includeFallback || effectiveLang === fallbackLang) return undefined;
  const fromFallback = instance.getResource(fallbackLang, "guides", key) as T | null | undefined;
  return isMissingTranslationValue(fromFallback, key) ? undefined : fromFallback;
}

function readFromFixedTranslator<T>(
  instance: I18nRuntime,
  effectiveLang: string,
  key: string,
): T | undefined {
  try {
    const fixed = instance.getFixedT?.(effectiveLang, "guides");
    if (typeof fixed !== "function") return undefined;
    const value = fixed(key, { returnObjects: true });
    return value !== undefined && value !== null && value !== key ? (value as T) : undefined;
  } catch {
    return undefined;
  }
}

function readFromBundles<T>(
  effectiveLang: string,
  fallbackLang: string,
  key: string,
  includeFallback: boolean,
): T | undefined {
  const localBundle = getGuidesBundle(effectiveLang);
  const local = readFromBundle<T>(localBundle, key);
  if (typeof local !== "undefined") return local;
  if (!includeFallback || effectiveLang === fallbackLang) return undefined;
  const fallbackBundle = getGuidesBundle(fallbackLang);
  return readFromBundle<T>(fallbackBundle, key);
}

const getGuideResource = <T = unknown>(
  lang: string | undefined,
  key: string,
  options?: GetGuideResourceOptions,
): T | null | undefined => {
  const instance = i18n as unknown as I18nRuntime;
  const effectiveLang = lang ?? (instance.language ?? getFallbackLanguage());
  const includeFallback = options?.includeFallback !== false;
  const fb = getFallbackLanguage();

  // 1) Prefer direct i18next store access when available
  const fromStore = readFromI18nStore<T>(instance, effectiveLang, fb, key, includeFallback);
  if (fromStore === null) return null;
  if (typeof fromStore !== "undefined") return fromStore;

  // 2) Try react-i18next fixed translator (works with test mocks); honour returnObjects
  const fromFixedTranslator = readFromFixedTranslator<T>(instance, effectiveLang, key);
  if (typeof fromFixedTranslator !== "undefined") return fromFixedTranslator;

  // 3) Fallback to eager guides bundles (used in tests and SSR environments)
  return readFromBundles<T>(effectiveLang, fb, key, includeFallback);
};

export default getGuideResource;
