// src/routes/guides/cheapEatsInPositano/buildRecommendationsContent.ts
import { GUIDE_KEY, type Recommendation } from "./constants";
import { normalizeText } from "./normalizeText";
import type { CheapEatsTranslationContext } from "./useCheapEatsTranslationContext";

export type CheapEatsRecommendationsContent = {
  recommendations: Recommendation[];
  recommendationsHeading: string;
  recommendationsTocLabel: string;
  fallbackWhereToEatLabel: string;
  itemListJson: string;
};

type BuildRecommendationsContentParams = {
  context: CheapEatsTranslationContext;
  structuredRecommendations: Recommendation[];
  fallbackRecommendations: Recommendation[];
  tocRecommendationsLabel?: string;
  recommendationsTitle?: string;
};

export function buildRecommendationsContent({
  context,
  structuredRecommendations,
  fallbackRecommendations,
  tocRecommendationsLabel,
  recommendationsTitle,
}: BuildRecommendationsContentParams): CheapEatsRecommendationsContent {
  const { t, normalizeEnglish, englishDefaults, lang, pathname, title, description } = context;

  const recommendations =
    structuredRecommendations.length > 0 ? structuredRecommendations : fallbackRecommendations;

  const normalizedRecommendationsTitle = normalizeText(
    recommendationsTitle,
    `content.${GUIDE_KEY}.recommendationsTitle`,
  );

  const fallbackWhereToEatLabel =
    normalizeText(t("labels.whereToEatHeading"), "labels.whereToEatHeading") ??
    normalizedRecommendationsTitle ??
    normalizeEnglish("labels.whereToEatHeading") ??
    normalizeEnglish(`content.${GUIDE_KEY}.recommendationsTitle`) ??
    englishDefaults.whereToEatHeading;

  const recommendationsHeading = recommendationsTitle ?? fallbackWhereToEatLabel;
  const recommendationsTocLabel =
    normalizedRecommendationsTitle ?? tocRecommendationsLabel ?? fallbackWhereToEatLabel;

  const itemListJson =
    recommendations.length === 0
      ? ""
      : JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          inLanguage: lang,
          name: title,
          description,
          url: `https://hostel-positano.com${pathname}`,
          itemListElement: recommendations.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            description: item.note,
          })),
        });

  return {
    recommendations,
    recommendationsHeading,
    recommendationsTocLabel,
    fallbackWhereToEatLabel,
    itemListJson,
  };
}
