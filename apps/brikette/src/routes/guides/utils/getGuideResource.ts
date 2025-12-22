// src/routes/guides/utils/getGuideResource.ts
import i18n from "@/i18n";
import { getGuidesBundle } from "@/locales/guides";

import getFallbackLanguage from "./getFallbackLanguage";

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
  const effectiveLang = lang ?? ((i18n as unknown as { language?: string }).language ?? getFallbackLanguage());
  const includeFallback = options?.includeFallback !== false;
  // 1) Prefer direct i18next store access when available
  const hasGetResource = typeof (i18n as unknown as { getResource?: unknown }).getResource === "function";
  if (hasGetResource) {
    const localized = (i18n as unknown as { getResource: (l: string, ns: string, k: string) => unknown }).getResource(
      effectiveLang,
      "guides",
      key,
    ) as T | null | undefined;
    if (localized === null) return null;
    if (typeof localized !== "undefined") return localized;
    if (!includeFallback) return localized;
    const fb = getFallbackLanguage();
    if (effectiveLang !== fb) {
      return (i18n as unknown as { getResource: (l: string, ns: string, k: string) => unknown }).getResource(
        fb,
        "guides",
        key,
      ) as T | null | undefined;
    }
    return localized;
  }

  // 2) Try react-i18next fixed translator (works with test mocks); honour returnObjects
  try {
    type FixedTranslationFn = (key: string, options?: { returnObjects?: boolean }) => unknown;
    const fixed = (i18n as unknown as {
      getFixedT?: (l: string, ns?: string) => FixedTranslationFn | undefined;
    }).getFixedT?.(effectiveLang, "guides");
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
  const fb = getFallbackLanguage();
  if (effectiveLang !== fb) {
    const enBundle = getGuidesBundle(fb);
    const fromEn = readFromBundle<T>(enBundle, key);
    if (typeof fromEn !== "undefined") return fromEn;
  }
  return undefined;
};

export default getGuideResource;
