/* src/routes/experiences/ExperiencesPage.tsx */
import { Fragment, memo } from "react";
import ExperiencesStructuredData from "@/components/seo/ExperiencesStructuredData";
import { CtaSection } from "./components/CtaSection";
import { ExperiencesGrid } from "./components/ExperiencesGrid";
import { FaqSection } from "./components/FaqSection";
import { GuideCollectionSection } from "./components/_GuideCollectionSection";
import { HeroSection } from "./components/_HeroSection";
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
    filterTag,
    faqTitle,
    faqEntries,
    cta,
    ctaLinks,
  } = useExperiencesPageContent();

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
              filterTag={filterTag}
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
            filterTag={filterTag}
            clearFilterHref={clearFilterHref}
            copy={guideCollectionCopy}
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
