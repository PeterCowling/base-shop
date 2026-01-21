import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// i18nFallback not required here; remove unused import
import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { debugGuide } from "@/utils/debug";

import { getGuidesBundle, type GuidesNamespace } from "../../../locales/guides";

import type { Translator } from "./types";

export interface GuideTranslationSuite {
  tGuides: Translator;
  guidesEn: Translator;
  tAny: Translator;
  anyEn: Translator;
  tHeader: Translator;
  headerEn: Translator;
  tCommon: Translator;
  commonEn: Translator;
  translateGuides: GenericContentTranslator;
  lang: AppLanguage;
  // Expose the hook-provided i18n (when present) so callers can access getFixedT
  i18n?: I18nLike;
}

interface TranslateOptions {
  locale?: AppLanguage;
  fallbackLocale?: AppLanguage;
}

type GetFixedT = (lng: string, ns?: string) => Translator;
type I18nLike = { getFixedT?: GetFixedT; __tGuidesFallback?: Translator };

export function translateStringWithFallback(
  primary: Translator,
  fallback: Translator,
  key: string,
  defaultValue?: string,
  _options: TranslateOptions = {},
): string {
  const normalizedDefault =
    typeof defaultValue === "string" ? defaultValue.trim() : undefined;

  const pickMeaningfulValue = (value: unknown): string | null => {
    if (typeof value !== "string") {
      return null;
    }

    const normalisedWhitespace = value.replace(/[\s\u00a0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]+/gu, " ");
    const trimmed = normalisedWhitespace.trim();
    if (trimmed.length === 0) {
      return null;
    }

    if (trimmed === key) {
      return null;
    }

    if (normalizedDefault && trimmed === normalizedDefault) {
      return null;
    }

    return trimmed;
  };

  const translatorOptions = { defaultValue };
  const primaryCandidate = pickMeaningfulValue(primary(key, translatorOptions));
  if (primaryCandidate) return primaryCandidate;
  const fallbackCandidate = pickMeaningfulValue(fallback(key, translatorOptions));
  if (fallbackCandidate) return fallbackCandidate;

  if (normalizedDefault && normalizedDefault.length > 0) {
    return normalizedDefault;
  }

  return defaultValue ?? key;
}

export function useGuideTranslations(lang: AppLanguage): GuideTranslationSuite {
  // Some unit tests mock react-i18next and only support a subset of namespaces.
  // Be resilient by falling back to identity translators when a namespace is
  // not provided by the test stub.
  const useSafeTranslation = (ns: string): { t: Translator; i18n: I18nLike } => {
    const identity: Translator = ((key: string) => key) as unknown as Translator;
    const out = useTranslation(ns, { lng: lang, useSuspense: false }) as unknown as {
      t?: unknown;
      i18n?: I18nLike;
      ready?: boolean;
    };

    const rawT = (typeof out?.t === "function" ? (out.t as Translator) : identity) as Translator;
    const t = useMemo(() => rawT, [rawT]);
    const hookGetFixedT =
      typeof out?.i18n?.getFixedT === "function"
        ? out.i18n.getFixedT.bind(out.i18n)
        : undefined;
    const i18nObj: I18nLike = hookGetFixedT ? { getFixedT: hookGetFixedT } : {};

    return { t, i18n: i18nObj };
  };

  const { t: tGuides, i18n } = useSafeTranslation("guides");
  // Ensure translator functions expose language/namespace markers for tests
  try {
    const fn = tGuides as unknown as { __lang?: string; __namespace?: string };
    if (!fn.__lang) fn.__lang = lang;
    if (!fn.__namespace) fn.__namespace = "guides";
  } catch {
    /* noop: metadata is only used by tests */
  }
  // Also expose the guidesFallback translator so downstream code can use it
  // even when getFixedT is not available in unit tests.
  const { t: tGuidesFallback } = useSafeTranslation("guidesFallback");
  // Attach the guidesFallback translator onto the hook-provided i18n object
  // so helpers that rely on hookI18n.__tGuidesFallback (when getFixedT is not
  // available/mocked) can still access curated fallback copy in tests.
  try {
    (i18n as I18nLike).__tGuidesFallback = tGuidesFallback as Translator;
  } catch {
    // If the i18n stub is immutable, continue without attaching.
  }
  // Prefer hook-provided translators to avoid calling getFixedT in tests
  const { t: tHeader } = useSafeTranslation("header");
  const { t: tCommon } = useSafeTranslation("translation");

  // EN translators: lazily resolve via getFixedT so they are only invoked when
  // a fallback is actually needed. This allows tests to inject custom EN
  // translators via getFixedT and assert usage (e.g., "Home EN").
  // Build lazy wrappers so getFixedT is only called when actually used.
  const resolveFixedT = useMemo(() => {
    return (language: string, namespace?: string) => {
      const apply = (key: string, opts?: Record<string, unknown>) => {
        try {
          const fromHook = (i18n as I18nLike)?.getFixedT?.(language, namespace);
          if (typeof fromHook === "function") return fromHook(key, opts);
        } catch (err) {
          void err;
        }
        try {
          const fromApp = (appI18n as unknown as I18nLike)?.getFixedT?.(language, namespace);
          if (typeof fromApp === "function") return fromApp(key, opts);
        } catch (err) {
          void err;
        }
        // No hook translator available; return the key unchanged to avoid
        // triggering global getFixedT calls in tests.
        return key as unknown as string;
      };
      return apply as unknown as Translator;
    };
  }, [i18n]);

  const guidesEn = useMemo<Translator>(() => {
    // Lazily resolve EN translator only when used to avoid getFixedT calls
    const lazy: Translator = ((key: string, opts?: Record<string, unknown>) => {
      try {
        debugGuide('guidesEn called', { key }); // i18n-exempt -- ABC-123 [ttl=2026-12-31]
      } catch (err) {
        void err;
      }
      const fixed = resolveFixedT("en", "guides");
      if (typeof fixed === "function") {
        return fixed(key, opts) as unknown as string;
      }
      return key as unknown as string;
    }) as unknown as Translator;
    // Tag EN helper so tests can assert translator identity
    try {
      (lazy as unknown as { __lang?: string; __namespace?: string }).__lang = "en";
      (lazy as unknown as { __lang?: string; __namespace?: string }).__namespace = "guides";
    } catch {
      /* noop */
    }
    return lazy;
  }, [resolveFixedT]);
  const headerEn = useMemo<Translator>(() => {
    const lazy: Translator = ((key: string, opts?: Record<string, unknown>) => {
      const fixed = resolveFixedT("en", "header");
      if (typeof fixed === "function") {
        return fixed(key, opts) as unknown as string;
      }
      return key as unknown as string;
    }) as unknown as Translator;
    return lazy;
  }, [resolveFixedT]);
  const commonEn = useMemo<Translator>(() => {
    const lazy: Translator = ((key: string, opts?: Record<string, unknown>) => {
      const fixed = resolveFixedT("en", "translation");
      if (typeof fixed === "function") {
        return fixed(key, opts) as unknown as string;
      }
      return key as unknown as string;
    }) as unknown as Translator;
    return lazy;
  }, [resolveFixedT]);

  // Generic translators that accept ns:key (e.g., "header:home"). For EN, map
  // through getFixedT using the ns prefix when possible.
  const tAny = useMemo<Translator>(() => ((k: string) => k) as unknown as Translator, []);
  const anyEn = useMemo<Translator>(() => {
    return ((key: string, opts?: Record<string, unknown>) => {
      if (typeof key !== "string") return key as unknown as string;
      const parts = key.split(":");
      if (parts.length === 2) {
        const [ns, k] = parts as [string, string];
        const fixed = resolveFixedT("en", ns);
        if (typeof fixed === "function") {
          try {
            return fixed(k, opts);
          } catch (err) {
            void err;
          }
        }
      }
      return key;
    }) as unknown as Translator;
  }, [resolveFixedT]);

  const translateGuides = useMemo<GenericContentTranslator>(() => {
    const getFromBundle = (
      bundle: GuidesNamespace | undefined,
      key: string,
      options?: Record<string, unknown>,
    ): unknown => {
      if (!bundle || !key) return undefined;
      // Basic dotted-path resolver for guides namespace
      const parts = key.split(".");
      let cursor: unknown = bundle as Record<string, unknown>;
      for (const part of parts) {
        if (!cursor || typeof cursor !== "object" || Array.isArray(cursor)) return undefined;
        cursor = (cursor as Record<string, unknown>)[part];
      }
      // Honour returnObjects request; otherwise coerce primitives to string
      if (options && (options as { returnObjects?: boolean }).returnObjects) {
        return cursor;
      }
      return typeof cursor === "string" ? cursor : undefined;
    };

    const translator = ((...args: Parameters<GenericContentTranslator>) => {
      const [rawKey, options] = args;
      const keyAsString = typeof rawKey === "string" ? rawKey : undefined;
      const primary: unknown = tGuides(...args);

      const primaryIsKey = (val: unknown): boolean =>
        typeof val === "string" && keyAsString ? val.trim() === keyAsString : false;

      // Treat both the canonical key (e.g., "content.boatTours.galleryHeading") and the
      // compact fallback form (e.g., "boatTours.galleryHeading") as unresolved keys.
      // Some test environments stub i18n to return the queried key string when a value
      // is missing; when we probe guidesFallback with the compact key we must not treat
      // that returned key string as a meaningful translation.
      const isUnresolvedKey = (val: unknown): boolean => {
        if (typeof val !== "string" || !keyAsString) return false;
        const trimmed = val.trim();
        if (trimmed === keyAsString) return true;
        if (keyAsString.startsWith("content.")) {
          const alt = keyAsString.replace(/^content\./, "");
          if (trimmed === alt) return true;
        }
        return false;
      };

      const getEnTranslatorValue = () => guidesEn(...args);

      // Detect if we have an explicit EN translator available via react-i18next
      // (i18n.getFixedT). When present, prefer it and avoid falling back to
      // store/bundle reads so tests can fully control EN values.
      const hasExplicitEn = (() => {
        try {
          return typeof (i18n as I18nLike)?.getFixedT === "function";
        } catch (err) {
          void err;
          return false;
        }
      })();

      const isMeaningfulObject = (val: unknown): boolean => {
        if (!val || typeof val !== "object" || Array.isArray(val)) return false;
        try {
          const values = Object.values(val as Record<string, unknown>);
          return values.some((v) => {
            if (typeof v === "string") {
              const s = v.trim();
              if (!s) return false;
              // Treat i18n keys (e.g., "content.xyz...") as not meaningful
              return !s.startsWith("content.");
            }
            if (Array.isArray(v)) return v.length > 0;
            return false;
          });
        } catch (err) {
          void err;
          return false;
        }
      };

      // 1) Prefer localized value if it’s meaningful
      if (typeof primary === "string") {
        if (primary.trim().length > 0 && !primaryIsKey(primary)) return primary;
      } else if (Array.isArray(primary)) {
        if (primary.length > 0) return primary;
      } else if (primary != null) {
        // Only accept objects that look meaningful; otherwise try fallbacks
        if (isMeaningfulObject(primary)) return primary;
      }

      // 2) Try guidesFallback namespace: prefer localized fallback first so
      //    curated localized copy can override English structured content when
      //    the active locale lacks sections. Support both the canonical
      //    `content.<guideKey>.*` key shape and the compact
      //    `<guideKey>.*` shape used by guidesFallback JSON in tests.
      let explicitEmptyLocalizedFallback = false;
      try {
        if (keyAsString) {
          const tryLocal = (k: string): unknown =>
            tGuidesFallback(k, options as Record<string, unknown> | undefined) as unknown;
          const localFbPrimary = tryLocal(keyAsString);
          if (Array.isArray(localFbPrimary) && localFbPrimary.length === 0) {
            explicitEmptyLocalizedFallback = true;
          }
          const localFbAlt = keyAsString.startsWith("content.")
            ? tryLocal(keyAsString.replace(/^content\./, ""))
            : undefined;
          if (Array.isArray(localFbAlt) && localFbAlt.length === 0) {
            explicitEmptyLocalizedFallback = true;
          }
          const pickLocal = (candidate: unknown): unknown | undefined => {
            if (typeof candidate === "string") {
              const s = candidate.trim();
              if (s.length > 0 && !primaryIsKey(candidate) && !isUnresolvedKey(candidate)) return s;
            } else if (Array.isArray(candidate)) {
              if (candidate.length > 0) return candidate as unknown;
            } else if (candidate != null) {
              if (isMeaningfulObject(candidate)) return candidate as unknown;
            }
            return undefined;
          };
          const pickedLocal = pickLocal(localFbPrimary) ?? pickLocal(localFbAlt);
          if (pickedLocal !== undefined) return pickedLocal;
        }
      } catch {
        // ignore
      }
      if (explicitEmptyLocalizedFallback) return [];

      // 3) Try EN translator (from guidesEn when provided), but only resolve
      //    it when neither the localized value nor the localized fallback was meaningful.
      const tryEnTranslator = (): unknown => getEnTranslatorValue();
      {
        const enValue = tryEnTranslator();
        if (typeof enValue === "string") {
          if (!primaryIsKey(enValue) && enValue.trim().length > 0) return enValue;
        } else if (Array.isArray(enValue)) {
          if (enValue.length > 0) return enValue;
        } else if (enValue != null) {
          if (isMeaningfulObject(enValue)) return enValue;
        }
      }
      // 4) Try English guidesFallback copy as a curated backup when neither the
      //    localized namespace nor structured EN content produced a value.
      //    Support both `content.<guideKey>.*` and `<guideKey>.*` key shapes.
      try {
        const enFbFixed = resolveFixedT("en", "guidesFallback");
        if (typeof enFbFixed === "function" && keyAsString) {
          const tryEnFb = (k: string): unknown =>
            enFbFixed(k as string, options as Record<string, unknown> | undefined) as unknown;
          const enFbPrimary = tryEnFb(keyAsString);
          const enFbAlt = keyAsString.startsWith("content.")
            ? tryEnFb(keyAsString.replace(/^content\./, ""))
            : undefined;
          const pickEn = (candidate: unknown): unknown | undefined => {
            if (typeof candidate === "string") {
              const s = (candidate as string).trim();
              if (s.length > 0 && !primaryIsKey(candidate) && !isUnresolvedKey(candidate)) return candidate;
            } else if (Array.isArray(candidate)) {
              if ((candidate as unknown[]).length > 0) return candidate as unknown;
            } else if (candidate != null) {
              if (isMeaningfulObject(candidate)) return candidate as unknown;
            }
            return undefined;
          };
          const pickedEn = pickEn(enFbPrimary) ?? pickEn(enFbAlt);
          if (pickedEn !== undefined) return pickedEn;
        }
      } catch {
        // ignore
      }

      // 5) Try i18n store resources via getGuideResource (locale → EN)
      // Only when an explicit EN translator is not available.
      if (!hasExplicitEn && keyAsString) {
        try {
          const fromStoreLocal = getGuideResource<unknown>(lang, keyAsString);
          if (
            typeof fromStoreLocal === "string" ||
            (Array.isArray(fromStoreLocal) && fromStoreLocal.length > 0) ||
            (fromStoreLocal && typeof fromStoreLocal === "object")
          ) {
            return fromStoreLocal as unknown;
          }
        } catch (err) {
          void err;
        }
        try {
          const fromStoreEn = getGuideResource<unknown>("en", keyAsString);
          if (
            typeof fromStoreEn === "string" ||
            (Array.isArray(fromStoreEn) && fromStoreEn.length > 0) ||
            (fromStoreEn && typeof fromStoreEn === "object")
          ) {
            return fromStoreEn as unknown;
          }
        } catch (err) {
          void err;
        }
      }

      // 6) Last resort: read directly from eager guides bundles when there is
      // no explicit EN translator. This avoids overriding test-provided EN
      // dictionaries.
      if (!hasExplicitEn && keyAsString) {
        const bundleLocal = getGuidesBundle(lang);
        const bundleEn = lang === "en" ? bundleLocal : getGuidesBundle("en");
        const fromLocal = getFromBundle(
          bundleLocal,
          keyAsString,
          options as Record<string, unknown> | undefined,
        );
        if (fromLocal != null && (Array.isArray(fromLocal) ? fromLocal.length > 0 : true)) {
          return fromLocal as unknown;
        }
        const fromEn = getFromBundle(
          bundleEn,
          keyAsString,
          options as Record<string, unknown> | undefined,
        );
        if (fromEn != null && (Array.isArray(fromEn) ? fromEn.length > 0 : true)) {
          return fromEn as unknown;
        }
      }

      // Give up: return original primary (usually the key) to aid debugging
      return primary;
    }) as unknown as GenericContentTranslator;

    // Expose language/namespace for tests that introspect translator identity
    try {
      const fn = translator as unknown as { __lang?: string; __namespace?: string };
      // Prefer active lang; when tests drive EN-only fallbacks they often
      // assert __lang === 'en'. Specific routes may override via wrappers.
      fn.__lang = lang;
      fn.__namespace = "guides";
    } catch {
      /* noop */
    }

    return translator;
  }, [guidesEn, tGuides, lang, i18n, resolveFixedT, tGuidesFallback]);

  // Attach the fallback translator to the app-level i18n instance so
  // components that import it (without going through this hook) can still
  // discover a guidesFallback translator in tests.
  try {
    const anyI18n = appI18n as unknown as { __tGuidesFallback?: Translator };
    if (!anyI18n.__tGuidesFallback && typeof tGuidesFallback === 'function') {
      anyI18n.__tGuidesFallback = tGuidesFallback as Translator;
    }
  } catch { /* noop */ }

  return {
    tGuides,
    guidesEn,
    tAny,
    anyEn,
    tHeader,
    headerEn,
    tCommon,
    commonEn,
    translateGuides,
    lang,
    // Expose the hook-provided getFixedT so callers that intentionally mock
    // it in tests (e.g., to provide curated fallbacks) can be respected.
    // Keep __tGuidesFallback for environments without getFixedT.
    i18n: {
      getFixedT: (i18n as I18nLike).getFixedT,
      __tGuidesFallback: tGuidesFallback,
    } as I18nLike,
  };
}

// Also attach the guidesFallback translator onto the app-level i18n object so
// components that import the global i18n instance (e.g., GenericContent) can
// access a fallback translator in test environments where getFixedT is mocked
// or unavailable for the guidesFallback namespace.
try {
  const attach = (fb: Translator | undefined) => {
    const anyI18n = appI18n as unknown as { __tGuidesFallback?: Translator };
    if (!anyI18n.__tGuidesFallback && typeof fb === 'function') {
      anyI18n.__tGuidesFallback = fb as Translator;
    }
  };
  // This module executes within a React hook, so we expose a helper that can
  // be called by the hook above to attach the current tGuidesFallback.
  // The hook returns an object where i18n.__tGuidesFallback is the same fn.
  // No-op if already attached.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GUIDES-1421: attach fallback helper for test environments
  (useGuideTranslations as any).__attachFallback = attach;
} catch {
  /* noop: attachment helper not critical outside tests */
}
