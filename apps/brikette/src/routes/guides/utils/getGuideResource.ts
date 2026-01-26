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
  if (typeof instance.getResource === "function") {
    const localized = instance.getResource(effectiveLang, "guides", key) as T | null | undefined;
    if (localized === null) return null;
    if (typeof localized !== "undefined") return localized;
    // Only use English fallback if includeFallback is true
    if (includeFallback && effectiveLang !== fb) {
      const fromFb = instance.getResource(fb, "guides", key) as T | null | undefined;
      if (typeof fromFb !== "undefined") return fromFb;
    }
    // Don't return early - fall through to try bundle strategies
    // This handles the case where the i18n namespace hasn't loaded yet
  }

  // 2) Try react-i18next fixed translator (works with test mocks); honour returnObjects
  try {
    const fixed = instance.getFixedT?.(effectiveLang, "guides");
    if (typeof fixed === "function") {
      const value = fixed(key, { returnObjects: true });
      if (value !== undefined && value !== null) return value as T;
    }
  } catch {
    /* ignore and try bundles */
  }

  // 3) Fallback to eager guides bundles (used in tests and SSR environments)
  const localBundle = getGuidesBundle(effectiveLang);
  const local = readFromBundle<T>(localBundle, key);
  if (typeof local !== "undefined") return local;
  if (!includeFallback) return undefined;
  if (effectiveLang !== fb) {
    const enBundle = getGuidesBundle(fb);
    const fromEn = readFromBundle<T>(enBundle, key);
    if (typeof fromEn !== "undefined") return fromEn;
  }
  return undefined;
};

export default getGuideResource;
