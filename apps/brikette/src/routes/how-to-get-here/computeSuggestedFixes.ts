// src/routes/how-to-get-here/computeSuggestedFixes.ts
// Utility for computing filter fix suggestions in empty state

import type { TFunction } from "i18next";

import type { DestinationFilter, DirectionFilter, TransportFilter } from "./types";

export type SuggestedFix = {
  label: string;
  onClick: () => void;
};

export type ComputeSuggestedFixesParams = {
  hasActiveFilters: boolean;
  hasResults: boolean;
  destinationFilter: DestinationFilter;
  transportFilter: TransportFilter;
  directionFilter: DirectionFilter;
  destinationName?: string;
  t: TFunction<"howToGetHere">;
  setDestinationFilter: (filter: DestinationFilter) => void;
  setTransportFilter: (filter: TransportFilter) => void;
  setDirectionFilter: (filter: DirectionFilter) => void;
};

/**
 * Computes suggested fixes when filters yield no results.
 * Orders suggestions by specificity (most specific first):
 * destination > transport > direction
 */
export function computeSuggestedFixes({
  hasActiveFilters,
  hasResults,
  destinationFilter,
  transportFilter,
  directionFilter,
  destinationName,
  t,
  setDestinationFilter,
  setTransportFilter,
  setDirectionFilter,
}: ComputeSuggestedFixesParams): SuggestedFix[] {
  // Only compute if we have filters active and no results
  if (!hasActiveFilters || hasResults) {
    return [];
  }

  const fixes: SuggestedFix[] = [];

  // Suggest removing destination filter (most specific)
  if (destinationFilter !== "all") {
    fixes.push({
      label: t("filters.suggestion.removeDestination", {
        destination: destinationName ?? destinationFilter,
        defaultValue: "Show all destinations",
      }),
      onClick: () => setDestinationFilter("all"),
    });
  }

  // Suggest removing transport filter
  if (transportFilter !== "all") {
    fixes.push({
      label: t("filters.suggestion.removeTransport", {
        mode: transportFilter,
        defaultValue: "Show all transport modes",
      }),
      onClick: () => setTransportFilter("all"),
    });
  }

  // Suggest removing direction filter
  if (directionFilter !== "all") {
    fixes.push({
      label: t("filters.suggestion.removeDirection", {
        defaultValue: "Show both directions",
      }),
      onClick: () => setDirectionFilter("all"),
    });
  }

  return fixes;
}
