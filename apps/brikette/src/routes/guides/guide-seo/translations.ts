import { useMemo } from "react";
import { useTranslation } from "react-i18next";

// i18nFallback not required here; remove unused import
import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import { IS_DEV } from "@/config/env";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { debugGuide } from "@/utils/debug";
import { asFallbackCarrier, asTranslator, tagTranslator } from "@/utils/i18n-types";

import { useTranslateGuides } from "./translateGuidesBuilder";
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
    const identity: Translator = asTranslator((key) => key);
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
  tagTranslator(tGuides, lang, "guides");
  // Also expose the guidesFallback translator so downstream code can use it
  // even when getFixedT is not available in unit tests.
  const { t: tGuidesFallback } = useSafeTranslation("guidesFallback");
  // Attach the guidesFallback translator onto the hook-provided i18n object
  // so helpers that rely on hookI18n.__tGuidesFallback (when getFixedT is not
  // available/mocked) can still access curated fallback copy in tests.
  try {
    (i18n as I18nLike).__tGuidesFallback = tGuidesFallback as Translator;
  } catch (err) {
    if (IS_DEV) console.debug("[translations] attach fallback", err);
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
        return key;
      };
      return asTranslator(apply);
    };
  }, [i18n]);

  const guidesEn = useMemo<Translator>(() => {
    // Lazily resolve EN translator only when used to avoid getFixedT calls
    const lazy = asTranslator((key, opts) => {
      try {
        debugGuide('guidesEn called', { key }); // i18n-exempt -- ABC-123 [ttl=2026-12-31]
      } catch (err) {
        void err;
      }
      const fixed = resolveFixedT("en", "guides");
      if (typeof fixed === "function") {
        return fixed(key, opts);
      }
      return key;
    });
    // Tag EN helper so tests can assert translator identity
    tagTranslator(lazy, "en", "guides");
    return lazy;
  }, [resolveFixedT]);
  const headerEn = useMemo<Translator>(() => {
    return asTranslator((key, opts) => {
      const fixed = resolveFixedT("en", "header");
      if (typeof fixed === "function") {
        return fixed(key, opts);
      }
      return key;
    });
  }, [resolveFixedT]);
  const commonEn = useMemo<Translator>(() => {
    return asTranslator((key, opts) => {
      const fixed = resolveFixedT("en", "translation");
      if (typeof fixed === "function") {
        return fixed(key, opts);
      }
      return key;
    });
  }, [resolveFixedT]);

  // Generic translators that accept ns:key (e.g., "header:home"). For EN, map
  // through getFixedT using the ns prefix when possible.
  const tAny = useMemo<Translator>(() => asTranslator((k) => k), []);
  const anyEn = useMemo<Translator>(() => {
    return asTranslator((key, opts) => {
      if (typeof key !== "string") return key;
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
    });
  }, [resolveFixedT]);

  const translateGuides = useTranslateGuides(tGuides, tGuidesFallback, guidesEn, lang, i18n, resolveFixedT);

  // Attach the fallback translator to the app-level i18n instance so
  // components that import it (without going through this hook) can still
  // discover a guidesFallback translator in tests.
  try {
    const carrier = asFallbackCarrier(appI18n);
    if (!carrier.__tGuidesFallback && typeof tGuidesFallback === 'function') {
      carrier.__tGuidesFallback = tGuidesFallback as Translator;
    }
  } catch (err) { if (IS_DEV) console.debug("[translations] attach carrier", err); }

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
    const carrier = asFallbackCarrier(appI18n);
    if (!carrier.__tGuidesFallback && typeof fb === 'function') {
      carrier.__tGuidesFallback = fb as Translator;
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
