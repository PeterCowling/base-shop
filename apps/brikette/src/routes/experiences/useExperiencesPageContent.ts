/* src/routes/experiences/useExperiencesPageContent.ts */
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { useLoaderData, useLocation, useSearchParams } from "react-router-dom";

import type { ExperiencesPageViewModel } from "./types";
import { useCta, useCtaLinks, useHeroCtas, useTokenBookNow } from "./useCtaContent";
import { useClearFilterHref } from "./useClearFilterHref";
import { useExperienceGuides } from "./useExperienceGuides";
import { useExperiencesTranslations } from "./useExperiencesTranslations";
import { useFaqContent } from "./useFaqContent";
import { useGuideCollectionCopy } from "./useGuideCollectionCopy";
import { useGuideCollectionId } from "./useGuideCollectionId";
import { useGroupedGuideCollections } from "./useGroupedGuideCollections";
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

  const filterTag = searchParams.get("tag");
  const normalizedFilterTag = filterTag?.trim().toLowerCase() ?? "";
  const filterTagDisplay = filterTag ? `#${filterTag}` : undefined;

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
    normalizedFilterTag,
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
    filterTag,
    faqTitle,
    faqEntries,
    cta,
    ctaLinks,
  };
}
