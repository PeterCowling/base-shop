/**
 * Content detection utilities for GenericOrFallbackContent.
 *
 * Consolidates the many content-presence checks used throughout the component.
 */
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import { ensureArray, ensureStringArray } from "@/utils/i18nSafe";

import { translatorProvidesStructured } from "./translatorWrapper";

type I18nInstance = {
  getFixedT?: (lng: string, ns?: string) => TFunction;
} | null | undefined;

type TranslationsBundle = {
  tGuides?: TFunction;
  guidesEn?: TFunction;
  translateGuides?: TFunction;
} | null | undefined;

/**
 * Compute whether EN has structured content, checking multiple sources.
 */
export function computeHasStructuredEn(params: {
  hasLocalizedContent: boolean;
  probeHasStructuredEn: boolean;
  translations: TranslationsBundle;
  guideKey: string;
}): boolean {
  const { hasLocalizedContent, probeHasStructuredEn, translations, guideKey } = params;

  if (hasLocalizedContent) return false;
  if (probeHasStructuredEn) return true;

  try {
    const guidesEn = translations?.guidesEn;
    if (translatorProvidesStructured(guidesEn, guideKey)) {
      return true;
    }
  } catch {
    /* noop */
  }

  try {
    const translateGuides = translations?.translateGuides;
    if (translatorProvidesStructured(translateGuides, guideKey)) {
      return true;
    }
  } catch {
    /* noop */
  }

  return false;
}

/**
 * Check for runtime-provided structured arrays via getGuideResource.
 *
 * Tests often provide these without wiring a translator; presence of
 * meaningful arrays indicates structured content for GenericContent.
 */
export function hasRuntimeStructuredContent(
  lang: string,
  guideKey: string,
  hasLocalizedContent: boolean,
): boolean {
  if (hasLocalizedContent) return false;

  try {
    const normaliseArr = (val: unknown): string[] =>
      Array.isArray(val)
        ? (val as unknown[])
            .map((v) => (typeof v === "string" ? v.trim() : String(v ?? "").trim()))
            .filter((s) => s.length > 0)
        : [];

    const ensureSectionMeaningful = (val: unknown): boolean => {
      if (Array.isArray(val)) {
        return normaliseArr(val).length > 0;
      }
      if (!val || typeof val !== "object") return false;
      const rec = val as Record<string, unknown>;
      const title = typeof rec["title"] === "string" ? rec["title"].trim() : "";
      const body = normaliseArr(rec["body"] ?? rec["items"]);
      return title.length > 0 || body.length > 0;
    };

    const checkFor = (lng: string): boolean => {
      const intro = getGuideResource<unknown>(lng, `content.${guideKey}.intro`);
      const sections = getGuideResource<unknown>(lng, `content.${guideKey}.sections`);
      const introOk = normaliseArr(intro).length > 0;
      const sectionsOk = Array.isArray(sections)
        ? (sections as unknown[]).some(ensureSectionMeaningful)
        : false;
      return introOk || sectionsOk;
    };

    // Prefer active locale, then EN (skip duplicate work when lang === 'en')
    return lang === "en" ? checkFor("en") : checkFor(lang) || checkFor("en");
  } catch {
    return false;
  }
}

/**
 * Check if the target locale has explicit localized content.
 */
export function hasExplicitLocalizedContent(params: {
  targetLocale: string | undefined;
  guideKey: string;
  hasLocalizedContent: boolean;
}): boolean {
  const { targetLocale, guideKey, hasLocalizedContent } = params;

  if (!targetLocale || targetLocale === "en") {
    return hasLocalizedContent;
  }

  const normalizeString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
  const isMeaningful = (value: unknown, placeholder: string): boolean => {
    const normalized = normalizeString(value);
    if (!normalized) return false;
    if (normalized === placeholder) return false;
    if (normalized === guideKey) return false;
    if (normalized.startsWith(`${placeholder}.`)) return false;
    if (normalized.toLowerCase() === "traduzione in arrivo") return false;
    return true;
  };

  try {
    const intro = getGuideResource<unknown>(targetLocale, `content.${guideKey}.intro`, {
      includeFallback: false,
    });
    const hasIntro = ensureStringArray(intro).some((entry) =>
      isMeaningful(entry, `content.${guideKey}.intro`),
    );
    if (hasIntro) return true;
  } catch {
    /* noop */
  }

  try {
    const sections = getGuideResource<unknown>(targetLocale, `content.${guideKey}.sections`, {
      includeFallback: false,
    });
    const hasSections = ensureArray(sections).some((entry) => {
      if (Array.isArray(entry)) {
        return ensureStringArray(entry).some((value) =>
          isMeaningful(value, `content.${guideKey}.sections`),
        );
      }
      if (!entry || typeof entry !== "object") return false;
      const record = entry as Record<string, unknown> & { list?: unknown };
      if (isMeaningful(record["title"], `content.${guideKey}.sections`)) return true;
      const bodyCandidates = [
        ...ensureStringArray(record["body"]),
        ...ensureStringArray(record["items"]),
        ...ensureStringArray(record["list"]),
      ];
      return bodyCandidates.some((value) => isMeaningful(value, `content.${guideKey}.sections`));
    });
    if (hasSections) return true;
  } catch {
    /* noop */
  }

  try {
    const faqs = getGuideResource<unknown>(targetLocale, `content.${guideKey}.faqs`, {
      includeFallback: false,
    });
    const faqsLegacy = getGuideResource<unknown>(targetLocale, `content.${guideKey}.faq`, {
      includeFallback: false,
    });
    const hasFaqs = (input: unknown): boolean => {
      const entries = ensureArray<{ q?: unknown; question?: unknown; a?: unknown; answer?: unknown }>(
        input,
      );
      return entries.some((faq) => {
        if (!faq || typeof faq !== "object") return false;
        const question = normalizeString(faq.q ?? faq.question);
        if (!isMeaningful(question, `content.${guideKey}.faqs`)) return false;
        const answers = ensureStringArray(faq.a ?? faq.answer).map((value) => normalizeString(value));
        return answers.some((answer) => answer.length > 0);
      });
    };
    if (hasFaqs(faqs) || hasFaqs(faqsLegacy)) return true;
  } catch {
    /* noop */
  }

  return hasLocalizedContent;
}

/**
 * Check if a structured fallback has meaningful content (intro or sections).
 */
export function hasMeaningfulStructuredFallback(fallback: unknown): boolean {
  try {
    const introArr = Array.isArray((fallback as Record<string, unknown>)?.intro)
      ? ((fallback as Record<string, unknown>).intro as unknown[])
      : [];
    const hasIntro = introArr.some((p) => typeof p === "string" && p.trim().length > 0);

    const sectionsArr = Array.isArray((fallback as Record<string, unknown>)?.sections)
      ? ((fallback as Record<string, unknown>).sections as unknown[])
      : [];
    const hasSections = sectionsArr.some(
      (s: unknown) =>
        Array.isArray((s as Record<string, unknown>)?.body) &&
        ((s as Record<string, unknown>).body as unknown[]).some(
          (v: unknown) => typeof v === "string" && v.trim().length > 0,
        ),
    );

    return hasIntro || hasSections;
  } catch {
    return false;
  }
}

/**
 * Get the localized manual fallback for a guide.
 */
export function getLocalizedManualFallback(lang: string, guideKey: string): unknown {
  try {
    return getGuideResource<unknown>(lang, `content.${guideKey}.fallback`, {
      includeFallback: false,
    });
  } catch {
    return undefined;
  }
}

/**
 * Resolve target locale from request and active language.
 */
export function resolveTargetLocale(requestedLang: string | undefined, lang: string): string {
  const requestedLocale =
    typeof requestedLang === "string" ? requestedLang.trim().toLowerCase() : undefined;
  return (
    requestedLocale && requestedLocale.length > 0 ? requestedLocale : lang
  )
    ?.trim()
    .toLowerCase();
}

/**
 * Check if a manual fallback has meaningful intro/sections content.
 */
export function hasManualFallbackMeaningfulContent(rawManual: unknown): boolean {
  if (!rawManual || typeof rawManual !== "object" || Array.isArray(rawManual)) {
    return false;
  }

  const obj = rawManual as Record<string, unknown>;
  const introArr = ensureStringArray(obj["intro"]).filter(
    (p) => (typeof p === "string" ? p.trim() : "").length > 0,
  );
  const sectionsArr = ensureArray<{ body?: unknown; items?: unknown }>(obj["sections"])
    .map((s) =>
      ensureStringArray(
        (s as Record<string, unknown>)["body"] ?? (s as Record<string, unknown>)["items"],
      ),
    )
    .filter((arr) => arr.length > 0);

  return introArr.length > 0 || sectionsArr.length > 0;
}

/**
 * Check for manual string fallback.
 */
export function hasManualStringFallback(
  t: TFunction,
  guideKey: string,
  hasLocalizedContent: boolean,
): boolean {
  if (hasLocalizedContent) return false;
  try {
    const k = `content.${guideKey}.fallback` as const;
    const v = t(k) as unknown;
    if (typeof v === "string") {
      const s = v.trim();
      return s.length > 0 && s !== k;
    }
  } catch {
    /* noop */
  }
  return false;
}

/**
 * Check for manual paragraph fallback.
 */
export function hasManualParagraphFallback(
  t: TFunction,
  guideKey: string,
  hasLocalizedContent: boolean,
): boolean {
  if (hasLocalizedContent) return false;
  try {
    const k = `content.${guideKey}.fallbackParagraph` as const;
    const v = t(k) as unknown;
    if (typeof v === "string") {
      const s = v.trim();
      return s.length > 0 && s !== k;
    }
  } catch {
    /* noop */
  }
  return false;
}

/**
 * Check if only FAQs are present (no intro/sections).
 */
export function hasOnlyFaqs(
  fallback: unknown,
  tFb: TFunction | undefined,
  guideKey: string,
): boolean {
  // Prefer inspecting the structured fallback object when available
  if (fallback) {
    const introArr = Array.isArray((fallback as Record<string, unknown>)?.intro)
      ? ((fallback as Record<string, unknown>).intro as unknown[])
      : [];
    const hasIntro = introArr.some((p) => typeof p === "string" && p.trim().length > 0);

    const sectionsArr = Array.isArray((fallback as Record<string, unknown>)?.sections)
      ? ((fallback as Record<string, unknown>).sections as unknown[])
      : [];
    const hasSections = sectionsArr.some(
      (s: unknown) =>
        Array.isArray((s as Record<string, unknown>)?.body) &&
        ((s as Record<string, unknown>).body as unknown[]).some(
          (v: unknown) => typeof v === "string" && v.trim().length > 0,
        ),
    );

    // Treat FAQs-only fallback as "onlyFaqs" to suppress visible blocks
    if (!hasIntro && !hasSections) return true;
    return false;
  }

  // Otherwise, probe the fallback translator for meaningful intro/sections
  if (!tFb) return true;

  const toArr = (v: unknown): string[] =>
    Array.isArray(v)
      ? (v as unknown[])
          .map((x) => (typeof x === "string" ? x.trim() : String(x)))
          .filter((s) => s.length > 0)
      : [];

  const intro = toArr(tFb(`content.${guideKey}.intro`, { returnObjects: true }));
  const sections = (() => {
    const raw = tFb(`content.${guideKey}.sections`, { returnObjects: true });
    const list = Array.isArray(raw) ? (raw as unknown[]) : [];
    return list
      .map((s: unknown) => {
        const body = toArr((s as Record<string, unknown>)?.body ?? (s as Record<string, unknown>)?.items);
        const title = typeof (s as Record<string, unknown>)?.title === "string"
          ? ((s as Record<string, unknown>).title as string).trim()
          : "";
        return body.length > 0 || title.length > 0 ? 1 : 0;
      })
      .reduce<number>((a, b) => a + b, 0);
  })();

  return intro.length === 0 && sections === 0;
}

type FallbackLike = {
  translator?: unknown;
  source?: string;
} | null | undefined;

/**
 * Resolve a guidesFallback translator from available sources.
 */
export function resolveFallbackTranslator(
  fallback: FallbackLike,
  hookI18n: I18nInstance,
  lang: string,
  translations: TranslationsBundle,
): TFunction | undefined {
  // Prefer curated guidesFallback translator. When the structured fallback
  // source is classified as EN structured guides (guidesEn), avoid using its
  // translator here so GenericContent can handle EN fallbacks as tests expect.
  if (typeof fallback?.translator === "function" && fallback?.source !== "guidesEn") {
    return fallback.translator as TFunction;
  }

  try {
    const fromHook = (hookI18n as Record<string, unknown>)?.__tGuidesFallback;
    if (typeof fromHook === "function") return fromHook as TFunction;
  } catch {
    /* noop */
  }

  try {
    const fixed = hookI18n?.getFixedT?.(lang, "guidesFallback");
    if (typeof fixed === "function") return fixed;
  } catch {
    /* noop */
  }

  try {
    const fixedApp = (i18n as I18nInstance)?.getFixedT?.(lang, "guidesFallback");
    if (typeof fixedApp === "function") return fixedApp;
  } catch {
    /* noop */
  }

  // Final resilience: fall back to active guides translator
  try {
    if (typeof translations?.tGuides === "function") {
      return translations.tGuides;
    }
  } catch {
    /* noop */
  }

  return undefined;
}
