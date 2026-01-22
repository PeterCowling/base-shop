import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DIRECTION_ORDER, TRANSPORT_MODE_ORDER } from "./transport";
import type {
  AugmentedDestinationLink,
  AugmentedDestinationSection,
  DestinationFilter,
  DirectionFilter,
  RouteDirection,
  TransportFilter,
  TransportMode,
} from "./types";

const FILTER_PARAM_KEYS = {
  transport: "mode",
  direction: "direction",
  destination: "place",
} as const;

function isTransportMode(candidate: unknown): candidate is TransportMode {
  return typeof candidate === "string" && TRANSPORT_MODE_ORDER.includes(candidate as TransportMode);
}

function isRouteDirection(candidate: unknown): candidate is RouteDirection {
  return typeof candidate === "string" && DIRECTION_ORDER.includes(candidate as RouteDirection);
}

function normalizeQueryValue(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function updateParams(
  current: URLSearchParams,
  updates: Partial<Record<(typeof FILTER_PARAM_KEYS)[keyof typeof FILTER_PARAM_KEYS], string | null>>,
): URLSearchParams {
  const next = new URLSearchParams(current);
  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  return next;
}

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
  const router = useRouter();
  const rawSearchParams = useSearchParams();
  // Provide a fallback empty URLSearchParams if null (e.g., during SSR or Suspense)
  const searchParams = rawSearchParams ?? new URLSearchParams();
  const setSearchParams = useCallback((params: URLSearchParams, options?: { replace?: boolean }) => {
    const search = params.toString();
    const url = search ? `?${search}` : window.location.pathname;
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [router]);

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

  const transportFilter = useMemo<TransportFilter>(() => {
    const raw = normalizeQueryValue(searchParams.get(FILTER_PARAM_KEYS.transport));
    if (!raw) return "all";
    if (!isTransportMode(raw)) return "all";
    return availableTransportModes.includes(raw) ? raw : "all";
  }, [availableTransportModes, searchParams]);

  const directionFilter = useMemo<DirectionFilter>(() => {
    const raw = normalizeQueryValue(searchParams.get(FILTER_PARAM_KEYS.direction));
    if (!raw) return "all";
    if (!isRouteDirection(raw)) return "all";
    return availableDirections.includes(raw) ? raw : "all";
  }, [availableDirections, searchParams]);

  const destinationFilter = useMemo<DestinationFilter>(() => {
    const raw = normalizeQueryValue(searchParams.get(FILTER_PARAM_KEYS.destination));
    if (!raw) return "all";
    const present = availableDestinations.some((destination) => destination.id === raw);
    return present ? raw : "all";
  }, [availableDestinations, searchParams]);

  const setTransportFilter = useCallback(
    (filter: TransportFilter) => {
      const next = updateParams(searchParams, {
        [FILTER_PARAM_KEYS.transport]: filter === "all" ? null : filter,
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setDirectionFilter = useCallback(
    (filter: DirectionFilter) => {
      const next = updateParams(searchParams, {
        [FILTER_PARAM_KEYS.direction]: filter === "all" ? null : filter,
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setDestinationFilter = useCallback(
    (filter: DestinationFilter) => {
      const next = updateParams(searchParams, {
        [FILTER_PARAM_KEYS.destination]: filter === "all" ? null : filter,
      });
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
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
    const next = updateParams(searchParams, {
      [FILTER_PARAM_KEYS.transport]: null,
      [FILTER_PARAM_KEYS.direction]: null,
      [FILTER_PARAM_KEYS.destination]: null,
    });
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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
