// src/routes/guides/cheapEatsInPositano/getFallbackGuideContent.ts
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import {
  type GalleryCopy,
  GUIDE_KEY,
  type Recommendation,
  type StructuredFaq,
} from "./constants";
import { normalizeText } from "./normalizeText";
import type { CheapEatsTranslationContext } from "./useCheapEatsTranslationContext";

export type CheapEatsFallbackContent = {
  recommendations: Recommendation[];
  galleryCopy: GalleryCopy[];
  intro: string[];
  faqs: StructuredFaq[];
};

type FaqPayload = {
  q?: unknown;
  a?: unknown;
};

const normaliseFaqAnswers = (answers: unknown): string[] => {
  if (Array.isArray(answers)) {
    return answers
      .map((entry) => (typeof entry === "string" ? normalizeText(entry) : undefined))
      .filter((entry): entry is string => Boolean(entry));
  }

  if (typeof answers === "string") {
    const normalised = normalizeText(answers);
    return normalised ? [normalised] : [];
  }

  return [];
};

const normaliseFaqs = (value: unknown): StructuredFaq[] =>
  ensureArray<FaqPayload>(value)
    .map((faq) => {
      const q = normalizeText(faq?.q);
      const a = normaliseFaqAnswers(faq?.a);

      if (!q || a.length === 0) {
        return null;
      }

      return { q, a } satisfies StructuredFaq;
    })
    .filter((faq): faq is StructuredFaq => faq !== null);

const normaliseIntro = (value: unknown): string[] =>
  ensureStringArray(value)
    .map((entry) => normalizeText(entry))
    .filter((entry): entry is string => Boolean(entry));

export function getFallbackGuideContent(
  context: CheapEatsTranslationContext,
  title: string,
): CheapEatsFallbackContent {
  const { t, getEnglishGuideResource } = context;

  const fallbackRecommendationsLocalized = ensureArray<{ name?: string; note?: string }>(
    t(`content.${GUIDE_KEY}.fallbackRecommendations`, { returnObjects: true }),
  )
    .map((entry) => {
      const name = normalizeText(entry?.name);
      const note = normalizeText(entry?.note);
      if (!name) return null;
      return note ? { name, note } : { name };
    })
    .filter((entry): entry is Recommendation => entry !== null);

  const fallbackRecommendationsEnglish = ensureArray<{ name?: string; note?: string }>(
    getEnglishGuideResource(`content.${GUIDE_KEY}.fallbackRecommendations`),
  )
    .map((entry) => {
      const name = normalizeText(entry?.name);
      const note = normalizeText(entry?.note);
      if (!name) return null;
      return note ? { name, note } : { name };
    })
    .filter((entry): entry is Recommendation => entry !== null);

  const recommendations =
    fallbackRecommendationsLocalized.length > 0
      ? fallbackRecommendationsLocalized
      : fallbackRecommendationsEnglish;

  const fallbackGalleryLocalized: GalleryCopy[] = ensureArray<GalleryCopy>(
    t(`content.${GUIDE_KEY}.fallbackGalleryItems`, { returnObjects: true }),
  )
    .map((entry) => {
      const alt = normalizeText(entry?.alt);
      if (!alt) return null;
      return {
        alt,
        caption: normalizeText(entry?.caption) ?? "",
      } satisfies GalleryCopy;
    })
    .filter((entry): entry is GalleryCopy => entry !== null);

  const fallbackGalleryEnglish: GalleryCopy[] = ensureArray<GalleryCopy>(
    getEnglishGuideResource(`content.${GUIDE_KEY}.fallbackGalleryItems`),
  )
    .map((entry) => {
      const alt = normalizeText(entry?.alt);
      if (!alt) return null;
      return {
        alt,
        caption: normalizeText(entry?.caption) ?? "",
      } satisfies GalleryCopy;
    })
    .filter((entry): entry is GalleryCopy => entry !== null);

  const galleryCopy =
    fallbackGalleryLocalized.length > 0
      ? fallbackGalleryLocalized
      : fallbackGalleryEnglish.length > 0
        ? fallbackGalleryEnglish
        : ([{ alt: title, caption: "" }] satisfies GalleryCopy[]);

  const introLocalized = normaliseIntro(
    t(`content.${GUIDE_KEY}.fallbackIntro`, { returnObjects: true }),
  );
  const introEnglish = normaliseIntro(
    getEnglishGuideResource(`content.${GUIDE_KEY}.fallbackIntro`),
  );
  const intro = introLocalized.length > 0 ? introLocalized : introEnglish;

  const faqsLocalized = normaliseFaqs(
    t(`content.${GUIDE_KEY}.fallbackFaqs`, { returnObjects: true }),
  );

  const faqsEnglish = normaliseFaqs(
    getEnglishGuideResource(`content.${GUIDE_KEY}.fallbackFaqs`),
  );

  const faqs = faqsLocalized.length > 0 ? faqsLocalized : faqsEnglish;

  return {
    recommendations,
    galleryCopy,
    intro,
    faqs,
  };
}
