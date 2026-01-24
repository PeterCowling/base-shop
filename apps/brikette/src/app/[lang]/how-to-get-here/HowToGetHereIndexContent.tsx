"use client";

// src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx
// Client component for how-to-get-here index page
import { Fragment, memo, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { Section } from "@acme/ui/atoms";

import { usePagePreload } from "@/hooks/usePagePreload";
import type { AppLanguage } from "@/i18n.config";
import { BeforeYouTravel } from "@/routes/how-to-get-here/components/BeforeYouTravel";
import { DestinationSections } from "@/routes/how-to-get-here/components/DestinationSections";
import { ExperienceGuidesSection } from "@/routes/how-to-get-here/components/ExperienceGuidesSection";
import { FiltersDialog } from "@/routes/how-to-get-here/components/FiltersDialog";
import { HeaderSection } from "@/routes/how-to-get-here/components/HeaderSection";
import {
  type ActiveFilterChip,
  HowToToolbar,
  type JumpToItem,
} from "@/routes/how-to-get-here/components/HowToToolbar";
import { IntroHighlights } from "@/routes/how-to-get-here/components/IntroHighlights";
import { RomeSection } from "@/routes/how-to-get-here/components/RomeSection";
import type { RoutePickerSelection } from "@/routes/how-to-get-here/components/RoutePicker";
import type {
  AugmentedDestinationLink,
  TransportMode,
} from "@/routes/how-to-get-here/types";
import { useDestinationFilters } from "@/routes/how-to-get-here/useDestinationFilters";
import { useHowToGetHereContent } from "@/routes/how-to-get-here/useHowToGetHereContent";

type Props = {
  lang: AppLanguage;
};

const ROME_SECTION_ID = "rome-travel-planner";
const EXPERIENCE_SECTION_ID = "experience-planners";
const INTRO_SECTION_ID = "arrival-help";

function scoreTransportMode(
  mode: TransportMode,
  preference: RoutePickerSelection["preference"]
): number {
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
  selection: RoutePickerSelection
): AugmentedDestinationLink | null {
  const candidates = links.filter((link) => link.direction === "to");
  const pool = candidates.length > 0 ? candidates : links;

  let best: AugmentedDestinationLink | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const link of pool) {
    const modeScore = link.transportModes.reduce(
      (sum, mode) => sum + scoreTransportMode(mode, selection.preference),
      0
    );
    const transferPenalty = Math.max(0, link.transportModes.length - 1) * 2;
    const lateNightPenalty =
      selection.arrival === "late-night" && link.transportModes.includes("ferry") ? 10 : 0;
    const score = modeScore + transferPenalty + lateNightPenalty;

    if (score < bestScore) {
      bestScore = score;
      best = link;
    }
  }

  return best;
}

function HowToGetHereIndexContent({ lang }: Props) {
  const { t } = useTranslation("howToGetHere", { lng: lang });
  usePagePreload({ lang, namespaces: ["howToGetHere", "guides"] });

  const content = useHowToGetHereContent(lang);
  const filtersState = useDestinationFilters(content.sections);
  const {
    destinationFilter,
    transportFilter,
    directionFilter,
    clearFilters,
    totalRoutes,
  } = filtersState;

  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);
  const [selection, setSelection] = useState<RoutePickerSelection | null>(null);

  const handleRoutePick = useCallback((sel: RoutePickerSelection) => {
    setSelection(sel);
  }, []);

  const jumpToItems: JumpToItem[] = (() => {
    const items: JumpToItem[] = [
      { id: INTRO_SECTION_ID, label: (t("jumpTo.arrival") as string) || "Arrival Help" },
    ];
    for (const section of content.sections) {
      items.push({ id: section.id, label: section.name });
    }
    items.push({
      id: ROME_SECTION_ID,
      label: (t("jumpTo.rome") as string) || "Rome",
    });
    items.push({
      id: EXPERIENCE_SECTION_ID,
      label: (t("jumpTo.experiences") as string) || "Experiences",
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
        onOpenFilters={() => setFiltersDialogOpen(true)}
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
        />
      </Section>

      {/* Destination Sections */}
      <DestinationSections
        sections={filtersState.filteredSections}
        showEmptyState={filtersState.hasActiveFilters && filtersState.filteredSections.length === 0}
        t={t}
        internalBasePath={content.internalBasePath}
        highlightedRouteSlug={null}
        preferredDirection={directionFilter !== "all" ? directionFilter : null}
        onOpenFilters={() => setFiltersDialogOpen(true)}
        onClearFilters={clearFilters}
      />

      {/* Rome Section */}
      <Section id={ROME_SECTION_ID} padding="default">
        <RomeSection
          showRomePlanner={content.showRomePlanner}
          romeTitle={content.romeTitle}
          romeDescription={content.romeDescription}
          romeTable={content.romeTable}
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
