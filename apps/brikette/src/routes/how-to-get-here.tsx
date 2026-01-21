import { Fragment, memo, useCallback, useEffect, useMemo, useState } from "react";
import type { LinksFunction, MetaFunction } from "react-router";
import { useLoaderData } from "react-router-dom";

import { Section } from "@acme/ui/atoms/Section";

import { BASE_URL } from "@/config/site";
import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { buildRouteLinks,buildRouteMeta } from "@/utils/routeHead";
import { getSlug } from "@/utils/slug";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

import { BeforeYouTravel } from "./how-to-get-here/components/BeforeYouTravel";
import { DestinationSections } from "./how-to-get-here/components/DestinationSections";
import { ExperienceGuidesSection } from "./how-to-get-here/components/ExperienceGuidesSection";
import { FiltersDialog } from "./how-to-get-here/components/FiltersDialog";
import { HeaderSection } from "./how-to-get-here/components/HeaderSection";
import { type ActiveFilterChip, HowToToolbar, type JumpToItem } from "./how-to-get-here/components/HowToToolbar";
import { IntroHighlights } from "./how-to-get-here/components/IntroHighlights";
import { RomeSection } from "./how-to-get-here/components/RomeSection";
import type { RoutePickerSelection } from "./how-to-get-here/components/RoutePicker";
import type {
  AugmentedDestinationLink,
  DestinationFilter,
  DirectionFilter,
  TransportFilter,
  TransportMode,
} from "./how-to-get-here/types";
import { useDestinationFilters } from "./how-to-get-here/useDestinationFilters";
import { useHowToGetHereContent } from "./how-to-get-here/useHowToGetHereContent";

const ROME_SECTION_ID = "rome-travel-planner";
const EXPERIENCE_SECTION_ID = "experience-planners";
const INTRO_SECTION_ID = "arrival-help";
const ROME_PLACE_ID = "rome";

export { clientLoader } from "./how-to-get-here/overview-loader";

function scoreTransportMode(mode: TransportMode, preference: RoutePickerSelection["preference"]): number {
  // Lower score = better.
  switch (preference) {
    case "fastest":
      return mode === "car" ? 0 : mode === "ferry" ? 1 : mode === "train" ? 2 : mode === "bus" ? 3 : 4;
    case "cheapest":
      return mode === "walk" ? 0 : mode === "bus" ? 1 : mode === "train" ? 2 : mode === "ferry" ? 3 : 4;
    case "least-walking":
      return mode === "car" ? 0 : mode === "train" ? 1 : mode === "bus" ? 2 : mode === "ferry" ? 3 : 4;
    case "luggage-friendly":
      return mode === "car" ? 0 : mode === "train" ? 1 : mode === "bus" ? 2 : mode === "ferry" ? 3 : 4;
    default:
      return 0;
  }
}

function pickBestLink(
  links: AugmentedDestinationLink[],
  selection: RoutePickerSelection,
): AugmentedDestinationLink | null {
  const candidates = links.filter((link) => link.direction === "to");
  const pool = candidates.length > 0 ? candidates : links;

  let best: AugmentedDestinationLink | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const link of pool) {
    const modeScore = link.transportModes.reduce((sum, mode) => sum + scoreTransportMode(mode, selection.preference), 0);
    const transferPenalty = Math.max(0, link.transportModes.length - 1) * 2;
    const lateNightPenalty = selection.arrival === "late-night" && link.transportModes.includes("ferry") ? 10 : 0;
    const score = modeScore + transferPenalty + lateNightPenalty;

    if (score < bestScore) {
      bestScore = score;
      best = link;
    }
  }

  return best;
}

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
    showRomePlanner,
    introKey,
    internalBasePath,
    experienceGuides,
  } = useHowToGetHereContent(lang);

  const filters = useDestinationFilters(sections);

  const { filteredSections } = filters;
  const availableDestinations = filters.availableDestinations;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [highlightedRouteSlug, setHighlightedRouteSlug] = useState<string | null>(null);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);

  const experienceGuidesCount = experienceGuides.items.length;
  const activeFilters: ActiveFilterChip[] = [];
  if (filters.transportFilter !== "all") {
    activeFilters.push({
      key: "transport",
      label: t("filters.transportLabel"),
      value: t(`filters.transportModes.${filters.transportFilter}`),
    });
  }
  if (filters.directionFilter !== "all") {
    activeFilters.push({
      key: "direction",
      label: t("filters.directionLabel"),
      value: filters.directionFilter === "to" ? t("filters.directionTo") : t("filters.directionFrom"),
    });
  }
  if (filters.destinationFilter !== "all") {
    const destinationName =
      availableDestinations.find((destination) => destination.id === filters.destinationFilter)?.name ??
      filters.destinationFilter;
    activeFilters.push({
      key: "destination",
      label: destinationFilterLabel,
      value: destinationName,
    });
  }

  const showEmptyState = filteredSections.length === 0;
  const resultsCount = useMemo(
    () => filteredSections.reduce((count, section) => count + section.links.length, 0),
    [filteredSections],
  );

  const suggestedFixes = useMemo(() => {
    if (!showEmptyState) return [];

    const countWith = (overrides: Partial<{
      transport: TransportFilter;
      direction: DirectionFilter;
      destination: DestinationFilter;
    }>): number => {
      const transport = overrides.transport ?? filters.transportFilter;
      const direction = overrides.direction ?? filters.directionFilter;
      const destination = overrides.destination ?? filters.destinationFilter;

      return sections.reduce((total, section) => {
        if (destination !== "all" && section.id !== destination) return total;
        const matches = section.links.filter((link) => {
          const transportOk = transport === "all" || link.transportModes.includes(transport);
          const directionOk = direction === "all" || link.direction === direction;
          return transportOk && directionOk;
        }).length;
        return total + matches;
      }, 0);
    };

    const fixes: Array<{ label: string; onClick: () => void; count: number }> = [];

    if (filters.transportFilter !== "all") {
      const count = countWith({ transport: "all" });
      if (count > 0) {
        fixes.push({
          label: t("filters.suggest.removeTransport", {
            defaultValue: `Remove transport type (${count})`,
            count,
          }),
          onClick: () => filters.setTransportFilter("all"),
          count,
        });
      }
    }

    if (filters.directionFilter !== "all") {
      const count = countWith({ direction: "all" });
      if (count > 0) {
        fixes.push({
          label: t("filters.suggest.removeDirection", {
            defaultValue: `Remove direction (${count})`,
            count,
          }),
          onClick: () => filters.setDirectionFilter("all"),
          count,
        });
      }
    }

    if (filters.destinationFilter !== "all") {
      const count = countWith({ destination: "all" });
      if (count > 0) {
        fixes.push({
          label: t("filters.suggest.showAllPlaces", {
            defaultValue: `Show all places (${count})`,
            count,
          }),
          onClick: () => filters.setDestinationFilter("all"),
          count,
        });
      }
    }

    return fixes.sort((a, b) => b.count - a.count).slice(0, 3).map(({ count: _count, ...rest }) => rest);
  }, [filters, sections, showEmptyState, t]);

  const placesForPicker = useMemo(() => {
    const list = [...availableDestinations];
    const romeName = romeTitle.trim();
    if (romeName) {
      list.push({ id: ROME_PLACE_ID, name: romeName });
    }
    return list;
  }, [availableDestinations, romeTitle]);

  const jumpTo = useMemo<JumpToItem[]>(() => {
    const items: JumpToItem[] = filteredSections.map((section) => ({
      id: section.id,
      label: section.name,
      count: section.links.length,
    }));
    const romeName = romeTitle.trim();
    if (romeName) {
      items.push({ id: ROME_SECTION_ID, label: romeName });
    }
    if (experienceGuidesCount > 0) {
      items.push({
        id: EXPERIENCE_SECTION_ID,
        label: t("experienceGuides.eyebrow", { defaultValue: "Experience planners" }),
        count: experienceGuidesCount,
      });
    }
    return items;
  }, [experienceGuidesCount, filteredSections, romeTitle, t]);

  const handleRoutePick = useCallback(
    (selection: RoutePickerSelection) => {
      if (selection.placeId === ROME_PLACE_ID) {
        filters.setTransportFilter("all");
        filters.setDirectionFilter("to");
        filters.setDestinationFilter("all");
        setHighlightedRouteSlug(null);
        setHighlightedSectionId(ROME_SECTION_ID);
        return;
      }

      // Reset to a predictable starting point, otherwise a prior filter can yield "no results".
      filters.setTransportFilter("all");
      filters.setDirectionFilter("to");
      filters.setDestinationFilter(selection.placeId as DestinationFilter);

      const section = sections.find((s) => s.id === selection.placeId);
      const best = section ? pickBestLink(section.links, selection) : null;

      if (best?.href) {
        setHighlightedRouteSlug(best.href);
      } else {
        setHighlightedRouteSlug(null);
      }

      setHighlightedSectionId(selection.arrival === "late-night" ? INTRO_SECTION_ID : selection.placeId);
    },
    [filters, sections],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    const routeId = highlightedRouteSlug ? `route-${highlightedRouteSlug}` : null;
    const routeElement = routeId ? document.getElementById(routeId) : null;
    const sectionElement = highlightedSectionId ? document.getElementById(highlightedSectionId) : null;
    const preferSection = highlightedSectionId === INTRO_SECTION_ID;
    const element = preferSection ? sectionElement ?? routeElement : routeElement ?? sectionElement;
    if (!(element instanceof HTMLElement)) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      element.focus();
    } catch {
      // ignore focus failures in non-browser contexts
    }
  }, [highlightedRouteSlug, highlightedSectionId, filteredSections]);

  useEffect(() => {
    if (!highlightedRouteSlug) return;
    const timeout = window.setTimeout(() => setHighlightedRouteSlug(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [highlightedRouteSlug]);

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
        className="mx-auto mt-5 max-w-5xl px-4 py-10 text-brand-text dark:text-brand-surface"
      >
        <section>
          <HeaderSection
            header={header}
            heroImageAlt={heroImageAlt}
            t={t}
            places={placesForPicker}
            onRoutePick={handleRoutePick}
            onOpenFilters={() => setFiltersOpen(true)}
          />

          <Section padding="none" className="mt-6">
            <HowToToolbar
              t={t}
              activeFilters={activeFilters}
              resultsCount={resultsCount}
              jumpTo={jumpTo}
              filters={filters}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </Section>

          <FiltersDialog
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            t={t}
            destinationFilterLabel={destinationFilterLabel}
            destinationFilterAllLabel={destinationFilterAllLabel}
            filtersHelper={filtersHelper}
            filters={filters}
          />

          <Section padding="none" className="mt-10">
            <BeforeYouTravel t={t} />
          </Section>

          <Section padding="none" className="mt-10" id={INTRO_SECTION_ID}>
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
              highlightedRouteSlug={highlightedRouteSlug}
              preferredDirection={filters.directionFilter === "all" ? null : filters.directionFilter}
              onOpenFilters={() => setFiltersOpen(true)}
              onClearFilters={filters.clearFilters}
              suggestedFixes={suggestedFixes}
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
