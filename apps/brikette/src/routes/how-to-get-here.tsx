import { Fragment, memo, useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import type { LinksFunction, MetaFunction } from "react-router";

import { Section } from "@acme/ui/atoms/Section";

import { i18nConfig, type AppLanguage } from "@/i18n.config";

import { BASE_URL } from "@/config/site";
import { buildRouteMeta, buildRouteLinks } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { HeaderSection, type ActiveFilter } from "./how-to-get-here/components/HeaderSection";
import { IntroHighlights } from "./how-to-get-here/components/IntroHighlights";
import { DestinationSections } from "./how-to-get-here/components/DestinationSections";
import { RomeSection } from "./how-to-get-here/components/RomeSection";
import { ExperienceGuidesSection } from "./how-to-get-here/components/ExperienceGuidesSection";
import { useHowToGetHereContent } from "./how-to-get-here/useHowToGetHereContent";
import { useDestinationFilters } from "./how-to-get-here/useDestinationFilters";
import type { DestinationFilter } from "./how-to-get-here/types";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

const ROME_DESTINATION_ID = "rome";
const ROME_SECTION_ID = "rome-travel-planner";
const EXPERIENCE_SECTION_ID = "experience-planners";

export { clientLoader } from "./how-to-get-here/overview-loader";

export default memo(function DirectionsPage() {
  const { lang, title, desc } = useLoaderData() as {
    lang: AppLanguage;
    title: string;
    desc: string;
  };
  const {
    t,
    header,
    sections,
    heroImageAlt,
    taxiContact,
    taxiEyebrow,
    shuttleEyebrow,
    romeTitle,
    romeDescription,
    romeTable,
    destinationFilterLabel,
    destinationFilterAllLabel,
    filtersHelper,
    activeFiltersLabel,
    showRomePlanner,
    introKey,
    internalBasePath,
    experienceGuides,
  } = useHowToGetHereContent(lang);

  const filters = useDestinationFilters(sections);

  const baseSetDestinationFilter = filters.setDestinationFilter;
  const romeDestinationName = romeTitle.trim();

  const handleDestinationSelect = useCallback(
    (filterValue: DestinationFilter) => {
      if (filterValue === ROME_DESTINATION_ID) {
        if (typeof document !== "undefined") {
          const romeElement = document.getElementById(ROME_SECTION_ID);
          if (romeElement instanceof HTMLElement) {
            romeElement.scrollIntoView({ behavior: "smooth", block: "start" });
            if (typeof romeElement.focus === "function") {
              romeElement.focus({ preventScroll: true });
            }
          }
        }
        baseSetDestinationFilter("all");
        return;
      }

      baseSetDestinationFilter(filterValue);
    },
    [baseSetDestinationFilter],
  );

  const filtersForHeader = useMemo(() => {
    const romeAlreadyPresent = filters.availableDestinations.some(
      (destination) => destination.id === ROME_DESTINATION_ID,
    );
    const availableDestinations =
      romeDestinationName && !romeAlreadyPresent
        ? [...filters.availableDestinations, { id: ROME_DESTINATION_ID, name: romeDestinationName }]
        : filters.availableDestinations;

    return {
      ...filters,
      setDestinationFilter: handleDestinationSelect,
      availableDestinations,
    };
  }, [filters, handleDestinationSelect, romeDestinationName]);

  const { availableTransportModes, filteredSections } = filters;
  const availableDestinations = filtersForHeader.availableDestinations;

  const experienceGuidesCount = experienceGuides.items.length;
  const stats: Array<{ label: string; value: number; href?: string }> = [
    { label: t("header.stats.routes"), value: filters.totalRoutes },
    { label: t("header.stats.destinations"), value: sections.length },
    { label: t("header.stats.transport"), value: availableTransportModes.length },
  ];

  if (experienceGuidesCount > 0) {
    stats.push({
      label: t("header.stats.experienceRoutes"),
      value: experienceGuidesCount,
      href: `#${EXPERIENCE_SECTION_ID}`,
    });
  }

  const activeFilters: ActiveFilter[] = [];
  if (filters.transportFilter !== "all") {
    activeFilters.push({
      label: t("filters.transportLabel"),
      value: t(`filters.transportModes.${filters.transportFilter}`),
    });
  }
  if (filters.directionFilter !== "all") {
    activeFilters.push({
      label: t("filters.directionLabel"),
      value: filters.directionFilter === "to" ? t("filters.directionTo") : t("filters.directionFrom"),
    });
  }
  if (filters.destinationFilter !== "all") {
    const destinationName =
      availableDestinations.find((destination) => destination.id === filters.destinationFilter)?.name ??
      filters.destinationFilter;
    activeFilters.push({
      label: destinationFilterLabel,
      value: destinationName,
    });
  }

  const showEmptyState = filteredSections.length === 0;

  // Deterministic test fallback for head tags
  const fallbackHeadDescriptors = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    const path = `/${lang}/${getSlug("howToGetHere", lang)}`;
    const url = `${BASE_URL}${path}`;
    return buildRouteMeta({ lang, title, description: desc, url, path });
  })();

  const fallbackHeadLinks = (() => {
    if (process.env.NODE_ENV !== "test") return undefined;
    return buildRouteLinks();
  })();

  useApplyFallbackHead(fallbackHeadDescriptors as unknown as ReturnType<typeof buildRouteMeta>, fallbackHeadLinks);

  return (
    <Fragment>
      <Section
        padding="none"
        className="mx-auto max-w-5xl px-4 py-10 text-brand-text dark:text-brand-surface"
      >
        <section>
          <HeaderSection
            header={header}
            stats={stats}
            heroImageAlt={heroImageAlt}
            t={t}
            destinationFilterLabel={destinationFilterLabel}
            destinationFilterAllLabel={destinationFilterAllLabel}
            filtersHelper={filtersHelper}
            activeFiltersLabel={activeFiltersLabel}
            activeFilters={activeFilters}
            filters={filtersForHeader}
          />

          <Section padding="none" className="mt-10">
            <IntroHighlights
              t={t}
              introKey={introKey}
              taxiEyebrow={taxiEyebrow}
              taxiContact={taxiContact}
              shuttleEyebrow={shuttleEyebrow}
            />
          </Section>

          <Section padding="none" className="mt-12 space-y-12">
            <DestinationSections
              sections={filteredSections}
              showEmptyState={showEmptyState}
              t={t}
              internalBasePath={internalBasePath}
            />
          </Section>

          <Section
            padding="none"
            className="mt-12 scroll-mt-28 rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/60"
            id={ROME_SECTION_ID}
            tabIndex={-1}
          >
            <RomeSection
              showRomePlanner={showRomePlanner}
              romeTitle={romeTitle}
              romeDescription={romeDescription}
              romeTable={romeTable}
              internalBasePath={internalBasePath}
            />
          </Section>

          {experienceGuidesCount > 0 ? (
            <Section padding="none" className="mt-12" id={EXPERIENCE_SECTION_ID}>
              <ExperienceGuidesSection content={experienceGuides} lang={lang} t={t} />
            </Section>
          ) : null}
        </section>
      </Section>
    </Fragment>
  );
});

// Route head exports – canonical, hreflang alternates, Twitter card
export const meta: MetaFunction = (args) => {
  const d = (((args as { data?: unknown }).data) || {}) as {
    lang?: AppLanguage;
    title?: string;
    desc?: string;
  };
  const lang = (d.lang as AppLanguage | undefined) ?? (i18nConfig.fallbackLng as AppLanguage);
  const title = d.title || "";
  const description = d.desc || "";
  const path = `/${lang}/${getSlug("howToGetHere", lang)}`;
  const url = `${BASE_URL}${path}`;
  return buildRouteMeta({ lang, title, description, url, path });
};

export const links: LinksFunction = () => buildRouteLinks();
