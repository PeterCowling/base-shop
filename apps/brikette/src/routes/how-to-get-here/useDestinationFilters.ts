import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export type DestinationFiltersInitialState = {
  transport?: string | null;
  direction?: string | null;
  destination?: string | null;
  basePath?: string;
};

export function useDestinationFilters(
  sections: AugmentedDestinationSection[],
  initialState: DestinationFiltersInitialState = {},
): DestinationFiltersState {
  const router = useRouter();
  const resolvedBasePath = initialState.basePath?.trim() || "";

  const setSearchParams = useCallback((params: URLSearchParams, options?: { replace?: boolean }) => {
    const search = params.toString();
    const fallbackPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const basePath = resolvedBasePath || fallbackPath;
    const url = search ? `${basePath}?${search}` : basePath;
    if (options?.replace) {
      router.replace(url);
    } else {
      router.push(url);
    }
  }, [resolvedBasePath, router]);

  const availableTransportModes = TRANSPORT_MODE_ORDER.filter((mode) =>
    sections.some((section) => section.links.some((link) => link.transportModes.includes(mode))),
  );

  const availableDirections = (() => {
    const present = new Set<RouteDirection>();
    sections.forEach((section) => {
      section.links.forEach((link) => present.add(link.direction));
    });
    return DIRECTION_ORDER.filter((direction) => present.has(direction));
  })();

  const totalRoutes = sections.reduce((count, section) => count + section.links.length, 0);

  const availableDestinations = sections.map((section) => ({
    id: section.id,
    name: section.name,
  }));

  const [transportFilterState, setTransportFilterState] = useState<TransportFilter>(() => {
    const raw = normalizeQueryValue(initialState.transport ?? null);
    return raw && isTransportMode(raw) ? raw : "all";
  });
  const [directionFilterState, setDirectionFilterState] = useState<DirectionFilter>(() => {
    const raw = normalizeQueryValue(initialState.direction ?? null);
    return raw && isRouteDirection(raw) ? raw : "all";
  });
  const [destinationFilterState, setDestinationFilterState] = useState<DestinationFilter>(() => {
    const raw = normalizeQueryValue(initialState.destination ?? null);
    return raw || "all";
  });

  const transportFilter: TransportFilter =
    transportFilterState !== "all" && !availableTransportModes.includes(transportFilterState)
      ? "all"
      : transportFilterState;
  const directionFilter: DirectionFilter =
    directionFilterState !== "all" && !availableDirections.includes(directionFilterState)
      ? "all"
      : directionFilterState;
  const destinationFilter: DestinationFilter =
    destinationFilterState !== "all" &&
    !availableDestinations.some((destination) => destination.id === destinationFilterState)
      ? "all"
      : destinationFilterState;

  useEffect(() => {
    if (transportFilterState !== transportFilter) {
      setTransportFilterState(transportFilter);
    }
  }, [transportFilter, transportFilterState]);

  useEffect(() => {
    if (directionFilterState !== directionFilter) {
      setDirectionFilterState(directionFilter);
    }
  }, [directionFilter, directionFilterState]);

  useEffect(() => {
    if (destinationFilterState !== destinationFilter) {
      setDestinationFilterState(destinationFilter);
    }
  }, [destinationFilter, destinationFilterState]);

  const writeFiltersToQuery = useCallback(
    (next: {
      transport: TransportFilter;
      direction: DirectionFilter;
      destination: DestinationFilter;
    }) => {
      const params = new URLSearchParams();
      if (next.transport !== "all") {
        params.set(FILTER_PARAM_KEYS.transport, next.transport);
      }
      if (next.direction !== "all") {
        params.set(FILTER_PARAM_KEYS.direction, next.direction);
      }
      if (next.destination !== "all") {
        params.set(FILTER_PARAM_KEYS.destination, next.destination);
      }
      setSearchParams(params, { replace: true });
    },
    [setSearchParams],
  );

  const setTransportFilter = useCallback(
    (filter: TransportFilter) => {
      setTransportFilterState(filter);
      writeFiltersToQuery({
        transport: filter,
        direction: directionFilter,
        destination: destinationFilter,
      });
    },
    [destinationFilter, directionFilter, writeFiltersToQuery],
  );

  const setDirectionFilter = useCallback(
    (filter: DirectionFilter) => {
      setDirectionFilterState(filter);
      writeFiltersToQuery({
        transport: transportFilter,
        direction: filter,
        destination: destinationFilter,
      });
    },
    [destinationFilter, transportFilter, writeFiltersToQuery],
  );

  const setDestinationFilter = useCallback(
    (filter: DestinationFilter) => {
      setDestinationFilterState(filter);
      writeFiltersToQuery({
        transport: transportFilter,
        direction: directionFilter,
        destination: filter,
      });
    },
    [directionFilter, transportFilter, writeFiltersToQuery],
  );

  const filteredSections = (() => {
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
  })();

  const hasActiveFilters =
    transportFilter !== "all" || directionFilter !== "all" || destinationFilter !== "all";

  const clearFilters = useCallback(() => {
    setTransportFilterState("all");
    setDirectionFilterState("all");
    setDestinationFilterState("all");
    writeFiltersToQuery({
      transport: "all",
      direction: "all",
      destination: "all",
    });
  }, [writeFiltersToQuery]);

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
