/* src/routes/experiences/useExperiencesPageContent.ts */
import { useLoaderData, useLocation, useSearchParams } from "react-router-dom";

import { resolveGuideTopicId } from "@/data/guideTopics";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { getTagMeta } from "@/utils/tags/resolvers";

import type { ExperiencesPageViewModel } from "./types";
import { useClearFilterHref } from "./useClearFilterHref";
import { useCta, useCtaLinks, useHeroCtas, useTokenBookNow } from "./useCtaContent";
import { useExperienceGuides } from "./useExperienceGuides";
import { useExperiencesTranslations } from "./useExperiencesTranslations";
import { useFaqContent } from "./useFaqContent";
import { useGroupedGuideCollections } from "./useGroupedGuideCollections";
import { useGuideCollectionCopy } from "./useGuideCollectionCopy";
import { useGuideCollectionId } from "./useGuideCollectionId";
import { useHeroContent } from "./useHeroContent";
import { useSectionsContent } from "./useSectionsContent";

type ExperiencesLoaderData = {
  lang: AppLanguage;
  title: string;
  desc: string;
};

export function useExperiencesPageContent(): ExperiencesPageViewModel {
  const { lang, title, desc } = useLoaderData() as ExperiencesLoaderData;
  const { supportedLngs } = i18nConfig;
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const { t, tTokens, experiencesEnT } = useExperiencesTranslations(lang);

  const topicParam = searchParams.get("topic");
  const tagParam = searchParams.get("tag");
  const filterParam = topicParam ?? tagParam;
  const normalizedFilterParam = filterParam?.trim().toLowerCase() ?? "";

  const resolvedTopicId = resolveGuideTopicId(normalizedFilterParam);
  const filterTopic = resolvedTopicId ?? null;

  const filterTopicLabel = resolvedTopicId ? getTagMeta(lang, resolvedTopicId).label || resolvedTopicId : undefined;
  const isLegacyTagFilter = Boolean(tagParam && !resolvedTopicId);
  const filterTagDisplay = resolvedTopicId
    ? `#${filterTopicLabel}`
    : isLegacyTagFilter && normalizedFilterParam
      ? `#${normalizedFilterParam}`
      : undefined;

  const filterTag = resolvedTopicId ? resolvedTopicId : isLegacyTagFilter ? normalizedFilterParam || null : null;
  const filterParamName: ExperiencesPageViewModel["filterParam"] = resolvedTopicId ? "topic" : "tag";

  const guideCollectionCopy = useGuideCollectionCopy({
    ...(filterTagDisplay ? { filterTagDisplay } : {}),
    t,
    experiencesEnT,
  });

  const experienceGuides = useExperienceGuides();
  const guideCollectionId = useGuideCollectionId(lang);

  const groupedGuideCollections = useGroupedGuideCollections({
    experienceGuides,
    guideCollectionCopy,
    guideCollectionId,
    normalizedFilterTopic: resolvedTopicId ?? "",
    t,
    experiencesEnT,
  });

  const hero = useHeroContent({ t, tTokens, experiencesEnT });
  const sections = useSectionsContent({ t });

  const { entries: faqEntries, jsonLd: faqJson, title: faqTitle } = useFaqContent({
    lang,
    pathname,
    t,
  });

  const cta = useCta({ t, experiencesEnT });
  const tokenBookNow = useTokenBookNow(tTokens);
  const ctaLinks = useCtaLinks({ cta, lang, tokenBookNow });
  const heroCtas = useHeroCtas({ hero, lang, tokenBookNow });
  const clearFilterHref = useClearFilterHref(lang);

  return {
    meta: {
      title,
      desc,
      lang,
      supportedLngs,
      faqJson,
    },
    hero,
    heroCtas,
    sections,
    experienceGuides,
    ...(groupedGuideCollections ? { groupedGuideCollections } : {}),
    guideCollectionCopy,
    guideCollectionId,
    clearFilterHref,
    filterParam: filterParamName,
    filterTag,
    filterTopic,
    faqTitle,
    faqEntries,
    cta,
    ctaLinks,
  };
}
