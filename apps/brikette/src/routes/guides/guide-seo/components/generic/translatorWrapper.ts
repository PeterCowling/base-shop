/**
 * Translator wrapper utilities for GenericContent rendering.
 *
 * Extracted from GenericOrFallbackContent.tsx to reduce component complexity.
 */
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import { shouldPreserveTranslatorWhenLocalized } from "./guidePolicies";

type I18nInstance = {
  getFixedT?: (lng: string, ns?: string) => TFunction;
  __tGuidesFallback?: TFunction;
} | null | undefined;

type TranslationsBundle = {
  tGuides?: TFunction;
  translateGuides?: TFunction;
  i18n?: I18nInstance;
} | null | undefined;

/**
 * Resolve the best English guides translator from available sources.
 */
export function resolveEnglishTranslator({
  hookCandidate,
  appCandidate,
  fallback,
  guideKey,
}: {
  hookCandidate: unknown;
  appCandidate: unknown;
  fallback: TFunction;
  guideKey: string;
}): TFunction {
  const evaluate = (candidate: unknown): TFunction | undefined => {
    if (typeof candidate !== "function") return undefined;
    try {
      const introRaw = candidate(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
      const intro = Array.isArray(introRaw) ? ensureStringArray(introRaw) : [];
      if (intro.length > 0) return candidate as TFunction;
      const sectionsRaw = ensureArray<{ title?: unknown; body?: unknown; items?: unknown }>(
        candidate(`content.${guideKey}.sections`, { returnObjects: true }) as unknown,
      );
      if (
        sectionsRaw.some((section) => {
          if (!section || typeof section !== "object") return false;
          const record = section as Record<string, unknown>;
          const title = typeof record["title"] === "string" ? record["title"].trim() : "";
          const body = ensureStringArray(record["body"] ?? record["items"]);
          return title.length > 0 || body.length > 0;
        })
      ) {
        return candidate as TFunction;
      }
    } catch {
      /* ignore translator errors */
    }
    return undefined;
  };

  return (
    evaluate(hookCandidate) ??
    evaluate(appCandidate) ??
    ((typeof appCandidate === "function"
      ? (appCandidate as TFunction)
      : typeof hookCandidate === "function"
      ? (hookCandidate as TFunction)
      : fallback))
  );
}

/**
 * Get EN translator candidates from hook and app i18n instances.
 */
export function getEnTranslatorCandidates(hookI18n: I18nInstance): {
  hookCandidate: TFunction | undefined;
  appCandidate: TFunction | undefined;
} {
  const hookCandidate = (() => {
    try {
      return hookI18n?.getFixedT?.("en", "guides");
    } catch {
      return undefined;
    }
  })();
  const appCandidate = (() => {
    try {
      return (i18n as I18nInstance)?.getFixedT?.("en", "guides");
    } catch {
      return undefined;
    }
  })();
  return { hookCandidate, appCandidate };
}

/**
 * Check if translator provides structured content for a guide.
 */
export function translatorProvidesStructured(translator: unknown, guideKey: string): boolean {
  if (typeof translator !== "function") return false;
  try {
    const introRaw = (translator as (key: string, options?: unknown) => unknown)(
      `content.${guideKey}.intro`,
      { returnObjects: true },
    ) as unknown;
    const introArr = ensureStringArray(introRaw);
    if (introArr.length > 0) {
      return true;
    }
  } catch {
    /* noop */
  }
  try {
    const sectionsRaw = (translator as (key: string, options?: unknown) => unknown)(
      `content.${guideKey}.sections`,
      { returnObjects: true },
    ) as unknown;
    const sections = ensureArray<{
      title?: unknown;
      body?: unknown;
      items?: unknown;
    }>(sectionsRaw);
    if (
      sections.some((section) => {
        if (!section || typeof section !== "object") return false;
        const title = typeof section.title === "string" ? section.title.trim() : "";
        const body = ensureStringArray(
          (section as { body?: unknown; items?: unknown }).body ??
            (section as { body?: unknown; items?: unknown }).items,
        );
        return title.length > 0 || body.length > 0;
      })
    ) {
      return true;
    }
  } catch {
    /* noop */
  }
  return false;
}

/**
 * Check if a value is an unresolved translation key.
 */
function isUnresolved(candidate: unknown, key: string | undefined): boolean {
  if (!key) return false;
  if (candidate == null) return true;
  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (!trimmed) return true;
    if (trimmed === key) return true;
    if (key.startsWith("content.")) {
      const alt = key.replace(/^content\./, "");
      if (trimmed === alt) return true;
    }
    return false;
  }
  if (Array.isArray(candidate)) {
    return candidate.length === 0;
  }
  if (typeof candidate === "object") {
    try {
      return Object.keys(candidate as Record<string, unknown>).length === 0;
    } catch {
      return true;
    }
  }
  return false;
}

/**
 * Collect fallback translators from various sources.
 */
function collectFallbackTranslators(
  translations: TranslationsBundle,
  baseT: TFunction,
): TFunction[] {
  const collected: TFunction[] = [];
  try {
    const translateGuides = translations?.translateGuides as TFunction | undefined;
    if (typeof translateGuides === "function" && translateGuides !== baseT) {
      collected.push(translateGuides);
    }
  } catch {
    /* noop */
  }
  try {
    const fbFromHook = translations?.i18n?.__tGuidesFallback as TFunction | undefined;
    if (typeof fbFromHook === "function" && !collected.includes(fbFromHook)) {
      collected.push(fbFromHook);
    }
  } catch {
    /* noop */
  }
  try {
    const fbFromApp = (i18n as I18nInstance)?.__tGuidesFallback as TFunction | undefined;
    if (typeof fbFromApp === "function" && !collected.includes(fbFromApp)) {
      collected.push(fbFromApp);
    }
  } catch {
    /* noop */
  }
  return collected;
}

interface WithTranslatorParams {
  guideKey: string;
  lang: string;
  hasLocalizedContent: boolean;
  englishFallbackAllowed: boolean;
  translations: TranslationsBundle;
  hookI18n: I18nInstance;
  t: TFunction;
}

/**
 * Wrap props to ensure GenericContent receives a properly configured translator.
 *
 * This handles:
 * - Establishing base translator (from props or context)
 * - Resolving EN fallback for unlocalized scenarios
 * - Wrapping translator to synthesize intro/FAQ arrays from EN when needed
 * - Tagging translators with __lang/__namespace for test assertions
 */
export function withTranslator(
  props: unknown,
  params: WithTranslatorParams,
): unknown {
  const {
    guideKey,
    lang,
    hasLocalizedContent,
    englishFallbackAllowed,
    translations,
    hookI18n,
    t,
  } = params;

  try {
    if (!props || typeof props !== "object" || Array.isArray(props)) {
      return props;
    }

    const obj = props as Record<string, unknown>;

    // Establish a base translator function to pass to GenericContent.
    let baseT: TFunction;
    if (typeof obj["t"] === "function") {
      baseT = obj["t"] as TFunction;
    } else {
      baseT = t;
      if (!hasLocalizedContent && englishFallbackAllowed) {
        const { hookCandidate, appCandidate } = getEnTranslatorCandidates(hookI18n);
        baseT = resolveEnglishTranslator({
          hookCandidate,
          appCandidate,
          fallback: baseT,
          guideKey,
        });
      }
    }

    // Route-specific: preserve active locale translator when localized arrays exist
    if (shouldPreserveTranslatorWhenLocalized(guideKey)) {
      try {
        const intro = translations?.tGuides?.(`content.${guideKey}.intro`, { returnObjects: true }) as unknown;
        const sections = translations?.tGuides?.(`content.${guideKey}.sections`, { returnObjects: true }) as unknown;
        const hasIntro = Array.isArray(intro) ? intro.some((v) => typeof v === "string" && v.trim().length > 0) : false;
        const hasSections = Array.isArray(sections)
          ? (sections as unknown[]).some((s) => {
              if (!s || typeof s !== "object") return false;
              const rec = s as Record<string, unknown>;
              const title = typeof rec["title"] === "string" ? (rec["title"] as string).trim() : "";
              const body = Array.isArray(rec["body"])
                ? (rec["body"] as unknown[]).filter((x) => typeof x === "string" && (x as string).trim().length > 0)
                : [];
              const items = Array.isArray(rec["items"])
                ? (rec["items"] as unknown[]).filter((x) => typeof x === "string" && (x as string).trim().length > 0)
                : [];
              return title.length > 0 || body.length > 0 || items.length > 0;
            })
          : false;
        if (hasIntro || hasSections) {
          return { ...obj, t: baseT };
        }
      } catch {
        /* noop */
      }
    }

    // Get EN translator for fallback scenarios
    const enT = !englishFallbackAllowed
      ? undefined
      : (() => {
          const { hookCandidate, appCandidate } = getEnTranslatorCandidates(hookI18n);
          return resolveEnglishTranslator({
            hookCandidate,
            appCandidate,
            fallback: baseT,
            guideKey,
          });
        })();

    // Preserve translator identity when localized content exists, or when
    // we are already using the EN fallback translator.
    if (hasLocalizedContent || (typeof enT === "function" && baseT === enT)) {
      try {
        const fn = baseT as { __lang?: string; __namespace?: string };
        if (!fn.__lang) {
          fn.__lang = hasLocalizedContent
            ? lang
            : englishFallbackAllowed
            ? "en"
            : lang;
        }
        if (!fn.__namespace) fn.__namespace = "guides";
      } catch {
        /* noop */
      }
      return { ...obj, t: baseT };
    }

    // Create wrapped translator with fallback support
    const wrapped = createWrappedTranslator(baseT, {
      guideKey,
      hasLocalizedContent,
      englishFallbackAllowed,
      translations,
      enT,
    });

    // Tag wrapped translator for test assertions
    try {
      const langTag = hasLocalizedContent
        ? lang
        : englishFallbackAllowed
        ? "en"
        : lang;
      (wrapped as unknown as Record<string, unknown>).__lang = langTag;
      (wrapped as unknown as Record<string, unknown>).__namespace = "guides";
    } catch {
      /* noop */
    }

    return { ...obj, t: wrapped };
  } catch {
    /* noop */
  }
  return props;
}

/**
 * Create a wrapped translator that handles fallback for intro/FAQ arrays.
 */
function createWrappedTranslator(
  baseT: TFunction,
  params: {
    guideKey: string;
    hasLocalizedContent: boolean;
    englishFallbackAllowed: boolean;
    translations: TranslationsBundle;
    enT: TFunction | undefined;
  },
): TFunction {
  const { guideKey, hasLocalizedContent, englishFallbackAllowed, translations, enT } = params;

  const wrapped = ((key: string, opts?: Record<string, unknown>) => {
    const val = baseT(key, opts);
    const keyAsString = typeof key === "string" ? key : undefined;
    const shouldProbeFallback =
      !hasLocalizedContent && typeof keyAsString === "string" && keyAsString.length > 0;

    const fallbackTranslators = shouldProbeFallback
      ? collectFallbackTranslators(translations, baseT)
      : [];

    if (shouldProbeFallback && isUnresolved(val, keyAsString)) {
      for (const translator of fallbackTranslators) {
        try {
          const fallbackVal = translator(key, opts);
          if (!isUnresolved(fallbackVal, keyAsString)) {
            return fallbackVal;
          }
        } catch {
          /* noop */
        }
      }
    }

    const isIntroKey =
      typeof key === "string" &&
      (key.endsWith(`content.${guideKey}.intro`) || key === `content.${guideKey}.intro`);
    const isFaqsKey =
      typeof key === "string" &&
      (key === `content.${guideKey}.faqs` || key === `content.${guideKey}.faq`);

    // For intro/faqs arrays, when the active translator returns empty,
    // fall back to EN to populate those fields.
    if (
      !hasLocalizedContent &&
      englishFallbackAllowed &&
      (isIntroKey || isFaqsKey) &&
      enT &&
      opts &&
      (opts.returnObjects || typeof val !== "string")
    ) {
      const toArr = (v: unknown): string[] =>
        ensureStringArray(v)
          .map((s) => s.trim())
          .filter(Boolean);

      if (isIntroKey) {
        const arr = Array.isArray(val) ? toArr(val) : typeof val === "string" ? toArr([val]) : [];
        if (arr.length === 0) {
          const enVal = enT(key, { returnObjects: true });
          const enArr = Array.isArray(enVal) ? toArr(enVal) : typeof enVal === "string" ? toArr([enVal]) : [];
          if (enArr.length > 0) return enArr;
        }
      } else if (isFaqsKey) {
        const toFaqs = (input: unknown): Array<{ q: string; a: string[] }> => {
          const raw = Array.isArray(input) ? (input as unknown[]) : [];
          return raw
            .map((e) => {
              if (!e || typeof e !== "object") return null;
              const faqObj = e as Record<string, unknown>;
              const qRaw =
                typeof faqObj["q"] === "string"
                  ? faqObj["q"]
                  : typeof faqObj["question"] === "string"
                  ? faqObj["question"]
                  : "";
              const q = qRaw.trim();
              const a = toArr(faqObj["a"] ?? faqObj["answer"]);
              return q && a.length > 0 ? { q, a } : null;
            })
            .filter((x): x is { q: string; a: string[] } => x != null);
        };
        const current = toFaqs(val);
        if (current.length === 0) {
          const enVal = enT(key, { returnObjects: true });
          const enFaqs = toFaqs(enVal);
          if (enFaqs.length > 0) return enFaqs;
        }
      }
    }

    return val;
  }) as TFunction;

  return wrapped;
}
