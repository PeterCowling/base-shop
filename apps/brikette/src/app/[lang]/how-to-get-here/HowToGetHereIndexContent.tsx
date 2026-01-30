"use client";

// src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx
// Client component for how-to-get-here index page
import { Fragment, memo, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";

import { Section } from "@acme/design-system/atoms";

import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { BeforeYouTravel } from "@/routes/how-to-get-here/components/BeforeYouTravel";
import { ExperienceGuidesSection } from "@/routes/how-to-get-here/components/ExperienceGuidesSection";
import { FiltersDialog } from "@/routes/how-to-get-here/components/FiltersDialog";
import { HeaderSection } from "@/routes/how-to-get-here/components/HeaderSection";
import {
  type ActiveFilterChip,
  HowToToolbar,
  type JumpToGroup,
  type JumpToItem,
  useHeaderStickyOffset,
} from "@/routes/how-to-get-here/components/HowToToolbar";
import { IntroHighlights } from "@/routes/how-to-get-here/components/IntroHighlights";
import { RomeSection } from "@/routes/how-to-get-here/components/RomeSection";
import type { RoutePickerSelection } from "@/routes/how-to-get-here/components/RoutePicker";
import { pickBestLink } from "@/routes/how-to-get-here/pickBestLink";
import { useDestinationFilters } from "@/routes/how-to-get-here/useDestinationFilters";
import { useHowToGetHereContent } from "@/routes/how-to-get-here/useHowToGetHereContent";
import { resolveLabel, useEnglishFallback } from "@/utils/translation-fallback";

// Lazy load DestinationSections to prevent bundling destinations data into guide pages
const DestinationSections = dynamic(
  () => import("@/routes/how-to-get-here/components/DestinationSections").then((mod) => ({ default: mod.DestinationSections })),
  { ssr: true }
);

type Props = {
  lang: AppLanguage;
};

const ROME_SECTION_ID = "rome-travel-planner";
const EXPERIENCE_SECTION_ID = "experience-planners";
const INTRO_SECTION_ID = "arrival-help";

function HowToGetHereIndexContent({ lang }: Props) {
  const { t } = useTranslation("howToGetHere", { lng: lang });
  usePagePreload({ lang, namespaces: ["howToGetHere", "guides"] });
  const fallbackT = useEnglishFallback("howToGetHere");

  const content = useHowToGetHereContent(lang);
  const filtersState = useDestinationFilters(content.sections);
  const {
    destinationFilter,
    transportFilter,
    directionFilter,
    setDestinationFilter,
    setTransportFilter,
    setDirectionFilter,
    clearFilters,
    totalRoutes,
  } = filtersState;

  // Compute suggested fixes when filters yield no results
  // Order: most specific filter first (destination > transport > direction)
  const suggestedFixes = useMemo(() => {
    // Only compute if we have filters active and no results
    if (!filtersState.hasActiveFilters || filtersState.filteredSections.length > 0) {
      return [];
    }

    const fixes: Array<{ label: string; onClick: () => void }> = [];

    // Suggest removing destination filter (most specific)
    if (destinationFilter !== "all") {
      const destinationName = content.sections.find((s) => s.id === destinationFilter)?.name ?? destinationFilter;
      fixes.push({
        label: t("filters.suggestion.removeDestination", {
          destination: destinationName,
          defaultValue: `Show all destinations`,
        }),
        onClick: () => setDestinationFilter("all"),
      });
    }

    // Suggest removing transport filter
    if (transportFilter !== "all") {
      fixes.push({
        label: t("filters.suggestion.removeTransport", {
          mode: transportFilter,
          defaultValue: `Show all transport modes`,
        }),
        onClick: () => setTransportFilter("all"),
      });
    }

    // Suggest removing direction filter
    if (directionFilter !== "all") {
      fixes.push({
        label: t("filters.suggestion.removeDirection", {
          defaultValue: `Show both directions`,
        }),
        onClick: () => setDirectionFilter("all"),
      });
    }

    return fixes;
  }, [
    filtersState.hasActiveFilters,
    filtersState.filteredSections.length,
    destinationFilter,
    transportFilter,
    directionFilter,
    content.sections,
    t,
    setDestinationFilter,
    setTransportFilter,
    setDirectionFilter,
  ]);

  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [highlightedRouteSlug, setHighlightedRouteSlug] = useState<string | null>(null);
  const [isLateNight, setIsLateNight] = useState(false);
  const stickyOffset = useHeaderStickyOffset();

  const handleRoutePick = useCallback((sel: RoutePickerSelection) => {
    // Track if user selected late-night arrival for taxi emphasis
    setIsLateNight(sel.arrival === "late-night");
    // Find the section matching the selected place
    const section = content.sections.find((s) => s.id === sel.placeId);
    if (!section) return;

    // Find the best route for the selection
    const bestLink = pickBestLink(section.links, sel);
    if (!bestLink) return;

    // Set highlighted route
    setHighlightedRouteSlug(bestLink.href);

    // Scroll to the route anchor with offset for sticky toolbar
    // Use requestAnimationFrame to ensure DOM is updated
    requestAnimationFrame(() => {
      const anchorId = `route-${bestLink.href}`;
      const element = document.getElementById(anchorId);
      if (element) {
        // Get the parent article (route card group) for better scroll target
        const card = element.closest("article");
        const scrollTarget = card ?? element;

        scrollTarget.scrollIntoView({ behavior: "smooth", block: "start" });
        // Adjust for sticky toolbar offset after smooth scroll starts
        setTimeout(() => {
          window.scrollBy({ top: -(stickyOffset + 16), behavior: "smooth" });
        }, 50);
      }
    });
  }, [content.sections, stickyOffset]);

  const jumpToItems: JumpToItem[] = (() => {
    const items: JumpToItem[] = [
      {
        id: INTRO_SECTION_ID,
        label: resolveLabel(
          t,
          "jumpTo.arrival",
          resolveLabel(fallbackT, "jumpTo.arrival", "Arrival help"),
        ),
        group: "quick-actions" as JumpToGroup,
      },
    ];
    for (const section of content.sections) {
      items.push({ id: section.id, label: section.name, group: "destinations" as JumpToGroup });
    }
    items.push({
      id: ROME_SECTION_ID,
      label: resolveLabel(
        t,
        "jumpTo.rome",
        resolveLabel(fallbackT, "jumpTo.rome", "Rome"),
      ),
      group: "utility" as JumpToGroup,
    });
    items.push({
      id: EXPERIENCE_SECTION_ID,
      label: resolveLabel(
        t,
        "jumpTo.experiences",
        resolveLabel(fallbackT, "jumpTo.experiences", "Experiences"),
      ),
      group: "utility" as JumpToGroup,
    });
    return items;
  })();

  const activeFilters: ActiveFilterChip[] = (() => {
    const chips: ActiveFilterChip[] = [];
    if (destinationFilter && destinationFilter !== "all") {
      chips.push({
        key: "destination",
        label: destinationFilter,
        value: destinationFilter,
      });
    }
    if (transportFilter && transportFilter !== "all") {
      chips.push({
        key: "transport",
        label: transportFilter,
        value: transportFilter,
      });
    }
    if (directionFilter && directionFilter !== "all") {
      chips.push({
        key: "direction",
        label: directionFilter === "to" ? "To Positano" : "From Positano",
        value: directionFilter,
      });
    }
    return chips;
  })();

  return (
    <Fragment>
      {/* Header */}
      <HeaderSection
        header={content.header}
        heroImageAlt={content.heroImageAlt}
        t={t}
        places={content.sections.map((s) => ({ id: s.id, name: s.name }))}
        onRoutePick={handleRoutePick}
      />

      {/* Toolbar */}
      <HowToToolbar
        t={t}
        activeFilters={activeFilters}
        resultsCount={totalRoutes}
        jumpTo={jumpToItems}
        filters={filtersState}
        onOpenFilters={() => setFiltersDialogOpen(true)}
      />

      {/* Intro Highlights */}
      <Section id={INTRO_SECTION_ID} padding="default">
        <IntroHighlights
          t={t}
          introKey={content.introKey}
          taxiEyebrow={content.taxiEyebrow}
          taxiContact={content.taxiContact}
          shuttleEyebrow={content.shuttleEyebrow}
          isLateNight={isLateNight}
        />
      </Section>

      {/* Destination Sections */}
      <DestinationSections
        sections={filtersState.filteredSections}
        showEmptyState={filtersState.hasActiveFilters && filtersState.filteredSections.length === 0}
        t={t}
        internalBasePath={content.internalBasePath}
        highlightedRouteSlug={highlightedRouteSlug}
        preferredDirection={directionFilter !== "all" ? directionFilter : null}
        onOpenFilters={() => setFiltersDialogOpen(true)}
        onClearFilters={clearFilters}
        suggestedFixes={suggestedFixes}
      />

      {/* Rome Section */}
      <Section id={ROME_SECTION_ID} padding="default">
        <RomeSection
          t={t}
          showRomePlanner={content.showRomePlanner}
          romeTitle={content.romeTitle}
          romeDescription={content.romeDescription}
          romeTable={content.romeTable}
          romeImage={content.romeImage}
          internalBasePath={content.internalBasePath}
        />
      </Section>

      {/* Before You Travel */}
      <BeforeYouTravel t={t} />

      {/* Experience Guides */}
      <Section id={EXPERIENCE_SECTION_ID} padding="default">
        <ExperienceGuidesSection
          content={content.experienceGuides}
          lang={lang}
          t={t}
        />
      </Section>

      {/* Filters Dialog */}
      <FiltersDialog
        open={filtersDialogOpen}
        onOpenChange={setFiltersDialogOpen}
        t={t}
        destinationFilterLabel={content.destinationFilterLabel}
        destinationFilterAllLabel={content.destinationFilterAllLabel}
        filtersHelper={content.filtersHelper}
        filters={filtersState}
      />
    </Fragment>
  );
}

export default memo(HowToGetHereIndexContent);
