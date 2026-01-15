import { useCallback, useMemo } from "react";

import type { GenericContentTranslator } from "@/components/guides/generic-content/types";
import type { GenericOrFallbackContentProps } from "../genericOrFallback.types";
import { ensureStringArray } from "@/utils/i18nSafe";
import getGuideResource from "@/routes/guides/utils/getGuideResource";
import i18n from "@/i18n";

import { hasStructuredLocal as probeHasStructuredLocal } from "../generic/computeProbes";

export interface GuideContentSharedState {
  articleDescriptionResolved?: string;
  withTranslator: (input: unknown) => unknown;
  hasStructuredLocal: boolean;
  localizedManualFallback?: unknown;
  hasRuntimeStructured: boolean;
}

type TranslatorMetadata = {
  __lang?: string;
  __namespace?: string;
};

type TranslatorOptions = Record<string, unknown> & { returnObjects?: boolean };

type TranslatorCandidate = Record<string, unknown> & { t?: unknown };

type FaqEntry = { q: string; a: string[] };

type TranslatorWithMetadata = GenericContentTranslator & TranslatorMetadata;

const annotateTranslator = (translator: GenericContentTranslator, langTag: string): void => {
  try {
    const fn = translator as TranslatorWithMetadata;
    if (!fn.__lang) fn.__lang = langTag;
    if (!fn.__namespace) fn.__namespace = "guides";
  } catch {
    /* noop: metadata only used in tests */
  }
};

const isTranslatorFn = (candidate: unknown): candidate is GenericContentTranslator =>
  typeof candidate === "function";

export function useGuideContentState(
  props: GenericOrFallbackContentProps,
): GuideContentSharedState {
  const {
    articleDescription,
    context,
    guideKey,
    hasLocalizedContent,
    hookI18n,
    lang,
    t,
    translations,
    preferManualWhenUnlocalized = false,
  } = props;

  const allowEnglishStructuredFallback = !preferManualWhenUnlocalized;

  const articleDescriptionResolved = useMemo(() => {
    if (typeof articleDescription === "string") {
      return articleDescription;
    }
    const contextDesc = context?.article?.description;
    if (typeof contextDesc === "string") {
      return contextDesc;
    }
    return undefined;
  }, [articleDescription, context]);

  const withTranslator = useCallback(
    (input: unknown) => {
      try {
        if (input && typeof input === "object" && !Array.isArray(input)) {
          const obj = input as TranslatorCandidate;
          const resolveGuidesTranslator = (
            language: string,
          ): GenericContentTranslator | undefined => {
            try {
              const fixedFromHook = hookI18n?.getFixedT?.(language, "guides");
              if (isTranslatorFn(fixedFromHook)) {
                return fixedFromHook;
              }
            } catch {
              /* noop */
            }
            try {
              const fixedFromApp =
                typeof i18n.getFixedT === "function" ? i18n.getFixedT(language, "guides") : undefined;
              if (isTranslatorFn(fixedFromApp)) {
                return fixedFromApp;
              }
            } catch {
              /* noop */
            }
            return undefined;
          };

          const translatorFromInput = isTranslatorFn(obj.t) ? obj.t : undefined;
          const enT = resolveGuidesTranslator("en");
          let baseT: GenericContentTranslator = translatorFromInput ?? (t as GenericContentTranslator);

          if (!translatorFromInput && !hasLocalizedContent && enT && allowEnglishStructuredFallback) {
            baseT = enT;
          }
          const baseTranslatorLang =
            hasLocalizedContent ||
            !(allowEnglishStructuredFallback && enT && baseT === enT)
              ? lang
              : "en";
          try {
            if (guideKey === "reginaGiovannaBath") {
              const introOptions: TranslatorOptions = { returnObjects: true };
              const intro = translations?.tGuides?.(
                `content.${guideKey}.intro`,
                introOptions,
              ) as unknown;
              const sectionsOptions: TranslatorOptions = { returnObjects: true };
              const sections = translations?.tGuides?.(
                `content.${guideKey}.sections`,
                sectionsOptions,
              ) as unknown;
              const introMeaningful = Array.isArray(intro)
                ? intro.some((val) => typeof val === "string" && val.trim().length > 0)
                : false;
              const sectionsMeaningful = Array.isArray(sections)
                ? (sections as unknown[]).some((section) => {
                    if (!section || typeof section !== "object") return false;
                    const rec = section as Record<string, unknown>;
                    const title =
                      typeof rec.title === "string" ? rec.title.trim() : "";
                    const bodyRaw = rec.body;
                    const body = Array.isArray(bodyRaw)
                      ? bodyRaw.filter(
                          (entry): entry is string =>
                            typeof entry === "string" && entry.trim().length > 0,
                        )
                      : [];
                    const itemsRaw = rec.items;
                    const items = Array.isArray(itemsRaw)
                      ? itemsRaw.filter(
                          (entry): entry is string =>
                            typeof entry === "string" && entry.trim().length > 0,
                        )
                      : [];
                    return title.length > 0 || body.length > 0 || items.length > 0;
                  })
                : false;
              if (introMeaningful || sectionsMeaningful) {
                annotateTranslator(baseT, baseTranslatorLang);
                return { ...obj, t: baseT };
              }
            }
          } catch {
            /* noop */
          }
          if (hasLocalizedContent || (enT && baseT === enT)) {
            annotateTranslator(baseT, baseTranslatorLang);
            return { ...obj, t: baseT };
          }
          const wrappedTranslator = ((key: string, opts?: TranslatorOptions) => {
            const val = baseT(key, opts);
            const introKey =
              typeof key === "string" &&
              (key.endsWith(`content.${guideKey}.intro`) ||
                key === `content.${guideKey}.intro`);
            const faqKey =
              typeof key === "string" &&
              (key === `content.${guideKey}.faqs` ||
                key === `content.${guideKey}.faq`);
            if (
              allowEnglishStructuredFallback &&
              !hasLocalizedContent &&
              (introKey || faqKey) &&
              enT &&
              opts &&
              (opts.returnObjects || typeof val !== "string")
            ) {
              const toStringArray = (value: unknown): string[] =>
                ensureStringArray(value)
                  .map((entry) => entry.trim())
                  .filter(Boolean);
              if (introKey) {
                const valArr = Array.isArray(val)
                  ? toStringArray(val)
                  : typeof val === "string"
                    ? toStringArray([val])
                    : [];
                if (valArr.length === 0) {
                  const enVal = enT(key, { returnObjects: true });
                  const enArr = Array.isArray(enVal)
                    ? toStringArray(enVal)
                    : typeof enVal === "string"
                      ? toStringArray([enVal])
                      : [];
                  if (enArr.length > 0) return enArr;
                }
              } else if (faqKey) {
                const toFaqs = (input: unknown): FaqEntry[] => {
                  const raw = Array.isArray(input) ? input : [];
                  return raw
                    .map((entry) => {
                      if (!entry || typeof entry !== "object") return null;
                      const rec = entry as Record<string, unknown>;
                      const primaryQuestion = rec.q;
                      const fallbackQuestion = rec.question;
                      const questionSource =
                        typeof primaryQuestion === "string"
                          ? primaryQuestion
                          : typeof fallbackQuestion === "string"
                            ? fallbackQuestion
                            : "";
                      const question = questionSource.trim();
                      const primaryAnswer = rec.a;
                      const fallbackAnswer = rec.answer;
                      const answer = toStringArray(
                        typeof primaryAnswer !== "undefined"
                          ? primaryAnswer
                          : fallbackAnswer,
                      );
                      return question && answer.length > 0
                        ? { q: question, a: answer }
                        : null;
                    })
                    .filter((entry): entry is FaqEntry => entry != null);
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
          }) as GenericContentTranslator;
          const wrapped = wrappedTranslator as unknown as typeof t;
          annotateTranslator(wrappedTranslator, baseTranslatorLang);
          return { ...obj, t: wrapped };
        }
      } catch {
        /* noop */
      }
      return input;
    },
    [guideKey, hasLocalizedContent, hookI18n, lang, t, translations, allowEnglishStructuredFallback],
  );

  const hasStructuredLocal = useMemo(
    () => probeHasStructuredLocal(translations, guideKey),
    [guideKey, translations],
  );

  const localizedManualFallback = useMemo(() => {
    try {
      return getGuideResource<unknown>(lang, `content.${guideKey}.fallback`, {
        includeFallback: false,
      });
    } catch {
      return undefined;
    }
  }, [guideKey, lang]);

  const hasRuntimeStructured = useMemo(() => {
    if (hasLocalizedContent) return false;
    try {
      const normaliseArr = (val: unknown): string[] =>
        Array.isArray(val)
          ? (val as unknown[])
              .map((entry) =>
                typeof entry === "string" ? entry.trim() : String(entry ?? "").trim(),
              )
              .filter((entry) => entry.length > 0)
          : [];
      const ensureSectionMeaningful = (val: unknown): boolean => {
        if (Array.isArray(val)) {
          return normaliseArr(val).length > 0;
        }
        if (!val || typeof val !== "object") return false;
        const rec = val as Record<string, unknown>;
        const title = typeof rec.title === "string" ? rec.title.trim() : "";
        const body = normaliseArr(rec.body ?? rec.items);
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
      return lang === "en" ? checkFor("en") : checkFor(lang) || checkFor("en");
    } catch {
      return false;
    }
  }, [guideKey, hasLocalizedContent, lang]);

  return {
    articleDescriptionResolved,
    hasRuntimeStructured,
    hasStructuredLocal,
    localizedManualFallback,
    withTranslator,
  };
}