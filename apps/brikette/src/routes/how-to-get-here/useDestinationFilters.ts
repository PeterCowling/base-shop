import { useCallback, useMemo, useState } from "react";

import { DIRECTION_ORDER, TRANSPORT_MODE_ORDER } from "./transport";
import type {
  AugmentedDestinationLink,
  AugmentedDestinationSection,
  DestinationFilter,
  DirectionFilter,
  RouteDirection,
  TransportMode,
  TransportFilter,
} from "./types";

export type DestinationFiltersState = {
  transportFilter: TransportFilter;
  directionFilter: DirectionFilter;
  destinationFilter: DestinationFilter;
  setTransportFilter: (filter: TransportFilter) => void;
  setDirectionFilter: (filter: DirectionFilter) => void;
  setDestinationFilter: (filter: DestinationFilter) => void;
  availableTransportModes: TransportMode[];
  availableDirections: RouteDirection[];
  availableDestinations: Array<{ id: string; name: string }>;
  filteredSections: AugmentedDestinationSection[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  totalRoutes: number;
};

export function useDestinationFilters(
  sections: AugmentedDestinationSection[],
): DestinationFiltersState {
  const [transportFilter, setTransportFilter] = useState<TransportFilter>("all");
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("all");
  const [destinationFilter, setDestinationFilter] = useState<DestinationFilter>("all");

  const availableTransportModes = useMemo(
    () =>
      TRANSPORT_MODE_ORDER.filter((mode) =>
        sections.some((section) => section.links.some((link) => link.transportModes.includes(mode))),
      ),
    [sections],
  );

  const availableDirections = useMemo(() => {
    const present = new Set<RouteDirection>();
    sections.forEach((section) => {
      section.links.forEach((link) => present.add(link.direction));
    });
    return DIRECTION_ORDER.filter((direction) => present.has(direction));
  }, [sections]);

  const totalRoutes = useMemo(
    () => sections.reduce((count, section) => count + section.links.length, 0),
    [sections],
  );

  const availableDestinations = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        name: section.name,
      })),
    [sections],
  );

  const filteredSections = useMemo(() => {
    const matchesTransport = (link: AugmentedDestinationLink) =>
      transportFilter === "all" || link.transportModes.includes(transportFilter);
    const matchesDirection = (link: AugmentedDestinationLink) =>
      directionFilter === "all" || link.direction === directionFilter;
    const matchesDestination = (section: AugmentedDestinationSection) =>
      destinationFilter === "all" || section.id === destinationFilter;

    return sections
      .filter((section) => matchesDestination(section))
      .map<AugmentedDestinationSection>((section) => {
        const filteredLinks = section.links.filter(
          (link) => matchesTransport(link) && matchesDirection(link),
        );
        return { ...section, links: filteredLinks };
      })
      .filter((section) => section.links.length > 0);
  }, [sections, transportFilter, directionFilter, destinationFilter]);

  const hasActiveFilters =
    transportFilter !== "all" || directionFilter !== "all" || destinationFilter !== "all";

  const clearFilters = useCallback(() => {
    setTransportFilter("all");
    setDirectionFilter("all");
    setDestinationFilter("all");
  }, []);

  return {
    transportFilter,
    directionFilter,
    destinationFilter,
    setTransportFilter,
    setDirectionFilter,
    setDestinationFilter,
    availableTransportModes,
    availableDirections,
    availableDestinations,
    filteredSections,
    hasActiveFilters,
    clearFilters,
    totalRoutes,
  } satisfies DestinationFiltersState;
}
