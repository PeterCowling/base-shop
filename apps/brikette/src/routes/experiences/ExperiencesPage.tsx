/* src/routes/experiences/ExperiencesPage.tsx */
import { Fragment, memo } from "react";

import ExperiencesStructuredData from "@/components/seo/ExperiencesStructuredData";

import { GuideCollectionSection } from "./components/_GuideCollectionSection";
import { HeroSection } from "./components/_HeroSection";
import { CtaSection } from "./components/CtaSection";
import { ExperiencesGrid } from "./components/ExperiencesGrid";
import { FaqSection } from "./components/FaqSection";
import { useExperiencesPageContent } from "./useExperiencesPageContent";

// Memoize the collection section at module scope so its identity is stable
// across renders and React can skip re-renders when props are unchanged.
const MemoGuideCollectionSection = memo(GuideCollectionSection);

function ExperiencesPageComponent() {
  const {
    meta,
    hero,
    heroCtas,
    sections,
    experienceGuides,
    groupedGuideCollections,
    guideCollectionCopy,
    guideCollectionId,
    clearFilterHref,
    filterParam,
    filterTag,
    faqTitle,
    faqEntries,
    cta,
    ctaLinks,
  } = useExperiencesPageContent();
  const totalGuideCount = experienceGuides.length;

  return (
    <Fragment>
      {null}
      <ExperiencesStructuredData />
      <section className="bg-brand-surface text-brand-text dark:bg-brand-bg">
        <HeroSection hero={hero} heroCtas={heroCtas} sections={sections} />
        <ExperiencesGrid sections={sections} />
        {groupedGuideCollections?.length ? (
          groupedGuideCollections.map((collection, index) => (
            <MemoGuideCollectionSection
              key={collection.id}
              id={collection.id}
              lang={meta.lang}
              guides={collection.guides}
              totalCount={totalGuideCount}
              filterTag={filterTag}
              filterParam={filterParam}
              clearFilterHref={clearFilterHref}
              copy={collection.copy}
              showFilters={collection.showFilters ?? index === 0}
            />
          ))
        ) : (
          <MemoGuideCollectionSection
            id={guideCollectionId}
            lang={meta.lang}
            guides={experienceGuides}
            totalCount={totalGuideCount}
            filterTag={filterTag}
            filterParam={filterParam}
            clearFilterHref={clearFilterHref}
            copy={guideCollectionCopy}
            showFilters={filterParam !== "tag"}
          />
        )}
        <FaqSection title={faqTitle} entries={faqEntries} />
        <CtaSection cta={cta} ctaLinks={ctaLinks} />
      </section>
    </Fragment>
  );
}

export const ExperiencesPage = memo(ExperiencesPageComponent);

export default ExperiencesPage;
