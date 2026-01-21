// src/routes/guides/cheapEatsInPositano/buildCheapEatsArticle.ts
import type { CheapEatsFaqContent } from "./buildFaqContent";
import type { CheapEatsGalleryContent } from "./buildGalleryContent";
import type { CheapEatsRecommendationsContent } from "./buildRecommendationsContent";
import type { CheapEatsArticleData } from "./constants";
import type { CheapEatsFallbackContent } from "./getFallbackGuideContent";
import type { CheapEatsStructuredContent } from "./getStructuredGuideContent";

type BuildCheapEatsArticleParams = {
  title: string;
  heroAlt: string;
  structuredContent: CheapEatsStructuredContent;
  fallbackContent: CheapEatsFallbackContent;
  recommendationsContent: CheapEatsRecommendationsContent;
  faqContent: CheapEatsFaqContent;
  galleryContent: CheapEatsGalleryContent;
};

export function buildCheapEatsArticle({
  title,
  heroAlt,
  structuredContent,
  fallbackContent,
  recommendationsContent,
  faqContent,
  galleryContent,
}: BuildCheapEatsArticleParams): CheapEatsArticleData {
  const {
    structuredIntro,
    structuredSections,
    structuredFaqs,
    structuredRecommendations,
    tocTitle,
  } = structuredContent;

  const hasStructured =
    structuredIntro.length > 0 ||
    structuredSections.length > 0 ||
    structuredFaqs.length > 0 ||
    structuredRecommendations.length > 0;

  return {
    title,
    heroAlt,
    hasStructured,
    structuredIntro,
    structuredSections,
    structuredFaqs,
    recommendations: recommendationsContent.recommendations,
    recommendationsHeading: recommendationsContent.recommendationsHeading,
    recommendationsTocLabel: recommendationsContent.recommendationsTocLabel,
    fallbackWhereToEatLabel: recommendationsContent.fallbackWhereToEatLabel,
    faqHeading: faqContent.faqHeading,
    faqTocLabel: faqContent.faqTocLabel,
    fallbackFaqLabel: faqContent.fallbackFaqLabel,
    fallbackIntro: fallbackContent.intro,
    fallbackFaqs: faqContent.fallbackFaqs,
    galleryHeading: galleryContent.galleryHeading,
    galleryItems: galleryContent.galleryItems,
    ...(typeof tocTitle === "string" ? { tocTitle } : {}),
  };
}
