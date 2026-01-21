// src/routes/guides/cheapEatsInPositano/useCheapEatsContent.ts
import type { AppLanguage } from "@/i18n.config";

import { buildCheapEatsArticle } from "./buildCheapEatsArticle";
import { buildCheapEatsMeta } from "./buildCheapEatsMeta";
import { buildFaqContent } from "./buildFaqContent";
import { buildGalleryContent } from "./buildGalleryContent";
import { buildRecommendationsContent } from "./buildRecommendationsContent";
import type { CheapEatsArticleData, CheapEatsMetaData } from "./constants";
import { GUIDE_KEY } from "./constants";
import { createBreadcrumb } from "./createBreadcrumb";
import { getFallbackGuideContent } from "./getFallbackGuideContent";
import { getStructuredGuideContent } from "./getStructuredGuideContent";
import { normalizeText } from "./normalizeText";
import { useCheapEatsTranslationContext } from "./useCheapEatsTranslationContext";

export type CheapEatsContent = {
  lang: AppLanguage;
  meta: CheapEatsMetaData;
  article: CheapEatsArticleData;
};

export function useCheapEatsContent(): CheapEatsContent {
  const context = useCheapEatsTranslationContext();

  const heroAlt =
    normalizeText(
      context.t(`content.${GUIDE_KEY}.heroAlt`),
      `content.${GUIDE_KEY}.heroAlt`,
    ) ?? context.title;

  const structuredContent = getStructuredGuideContent(context);
  const fallbackContent = getFallbackGuideContent(context, context.title);

  const recommendationsContent = buildRecommendationsContent({
    context,
    structuredRecommendations: structuredContent.structuredRecommendations,
    fallbackRecommendations: fallbackContent.recommendations,
    ...(typeof structuredContent.tocRecommendationsLabel === "string"
      ? { tocRecommendationsLabel: structuredContent.tocRecommendationsLabel }
      : {}),
    ...(typeof structuredContent.recommendationsTitle === "string"
      ? { recommendationsTitle: structuredContent.recommendationsTitle }
      : {}),
  });

  const faqContent = buildFaqContent({
    context,
    fallbackFaqs: fallbackContent.faqs,
    ...(typeof structuredContent.tocFaqLabel === "string"
      ? { tocFaqLabel: structuredContent.tocFaqLabel }
      : {}),
  });

  const galleryContent = buildGalleryContent({
    context,
    title: context.title,
    galleryTranslations: structuredContent.galleryTranslations,
    fallbackGalleryCopy: fallbackContent.galleryCopy,
    ...(typeof structuredContent.galleryTitle === "string"
      ? { galleryTitle: structuredContent.galleryTitle }
      : {}),
  });

  const article = buildCheapEatsArticle({
    title: context.title,
    heroAlt,
    structuredContent,
    fallbackContent,
    recommendationsContent,
    faqContent,
    galleryContent,
  });

  const breadcrumb = createBreadcrumb({ context, title: context.title });
  const meta = buildCheapEatsMeta({
    title: context.title,
    description: context.description,
    breadcrumb,
    itemListJson: recommendationsContent.itemListJson,
  });

  return {
    lang: context.lang,
    meta,
    article,
  };
}
