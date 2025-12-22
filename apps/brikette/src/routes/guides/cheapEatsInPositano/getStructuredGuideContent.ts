// src/routes/guides/cheapEatsInPositano/getStructuredGuideContent.ts
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import {
  GUIDE_KEY,
  type Recommendation,
  type StructuredFaq,
  type StructuredSection,
  type TocConfig,
} from "./constants";
import type { CheapEatsTranslationContext } from "./useCheapEatsTranslationContext";

export type CheapEatsStructuredContent = {
  structuredIntro: string[];
  structuredSections: StructuredSection[];
  structuredFaqs: StructuredFaq[];
  structuredRecommendations: Recommendation[];
  recommendationsTitle?: string;
  tocTitle?: string;
  tocFaqLabel?: string;
  tocRecommendationsLabel?: string;
  galleryTranslations: Array<{ alt?: string; caption?: string }>;
  galleryTitle?: string;
};

export function getStructuredGuideContent(
  context: CheapEatsTranslationContext,
): CheapEatsStructuredContent {
  const { getGuideResource } = context;

  const structuredIntro = ensureStringArray(getGuideResource(`content.${GUIDE_KEY}.intro`)).map(
    (entry) => entry.trim(),
  );

  const structuredSections = ensureArray<{ id?: string; title?: string; body?: unknown }>(
    getGuideResource(`content.${GUIDE_KEY}.sections`),
  ).map((section) => ({
    id: String(section.id ?? ""),
    title: String(section.title ?? ""),
    body: ensureStringArray(section.body).map((paragraph) => paragraph.trim()),
  })) as StructuredSection[];

  const structuredFaqs = ensureArray<{ q?: string; a?: unknown }>(
    getGuideResource(`content.${GUIDE_KEY}.faqs`),
  ).map(
    (faq) => ({
      q: String(faq.q ?? ""),
      a: ensureStringArray(faq.a).map((answer) => answer.trim()),
    }),
  ) as StructuredFaq[];

  const structuredRecommendations = ensureArray<{ name?: string; note?: string }>(
    getGuideResource(`content.${GUIDE_KEY}.recommendations`),
  )
    .map((entry) => {
      const name = typeof entry?.name === "string" ? entry.name.trim() : "";
      const noteRaw = typeof entry?.note === "string" ? entry.note.trim() : "";
      const note = noteRaw.length > 0 ? noteRaw : undefined;

      return note ? { name, note } : { name };
    })
    .filter((entry): entry is Recommendation => entry.name.length > 0);

  const tocConfig = getGuideResource<TocConfig>(`content.${GUIDE_KEY}.toc`);
  const tocTitle = typeof tocConfig?.title === "string" ? tocConfig.title : undefined;
  const tocFaqLabel = typeof tocConfig?.faqs === "string" ? tocConfig.faqs : undefined;
  const tocRecommendationsLabel =
    typeof tocConfig?.recommendations === "string" ? tocConfig.recommendations : undefined;

  const recommendationsTitleRaw = getGuideResource<string>(
    `content.${GUIDE_KEY}.recommendationsTitle`,
  );
  const recommendationsTitle =
    typeof recommendationsTitleRaw === "string" && recommendationsTitleRaw.trim().length > 0
      ? recommendationsTitleRaw
      : undefined;

  const galleryTranslations = ensureArray<{ alt?: string; caption?: string }>(
    getGuideResource(`content.${GUIDE_KEY}.gallery.items`),
  ).map((entry) => ({
    ...(typeof entry?.alt === "string" ? { alt: entry.alt } : {}),
    ...(typeof entry?.caption === "string" ? { caption: entry.caption } : {}),
  }));

  const galleryTitleRaw = getGuideResource<string>(`content.${GUIDE_KEY}.gallery.title`);
  const galleryTitle =
    typeof galleryTitleRaw === "string" && galleryTitleRaw.trim().length > 0 ? galleryTitleRaw : undefined;

  return {
    structuredIntro,
    structuredSections,
    structuredFaqs,
    structuredRecommendations,
    ...(typeof recommendationsTitle === "string" ? { recommendationsTitle } : {}),
    ...(typeof tocTitle === "string" ? { tocTitle } : {}),
    ...(typeof tocFaqLabel === "string" ? { tocFaqLabel } : {}),
    ...(typeof tocRecommendationsLabel === "string" ? { tocRecommendationsLabel } : {}),
    galleryTranslations,
    ...(typeof galleryTitle === "string" ? { galleryTitle } : {}),
  };
}
