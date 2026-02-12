/**
 * useBoardFilters Hook
 * Manages board filtering logic (search, filter chips, view modes)
 * Extracted from BoardView to reduce component complexity
 * BOS-UX-10
 */

import { useMemo } from "react";

import type { Card, Lane } from "@/lib/types";

import { applyFilters, type FilterType } from "../components/board/FilterChips";

interface UseBoardFiltersOptions {
  cardsByLane: Record<Lane, Card[]>;
  visibleLanes: Lane[];
  searchQuery: string;
  activeFilters: FilterType[];
  currentUserName: string;
}

interface UseBoardFiltersResult {
  filteredCardsByLane: Record<Lane, Card[]>;
}

export function useBoardFilters({
  cardsByLane,
  visibleLanes,
  searchQuery,
  activeFilters,
  currentUserName,
}: UseBoardFiltersOptions): UseBoardFiltersResult {
  // Filter cards based on search and filters
  const filteredCardsByLane = useMemo(() => {
    const result: Record<Lane, Card[]> = {} as Record<Lane, Card[]>;

    visibleLanes.forEach((lane) => {
      const laneCards = cardsByLane[lane] || [];

      // Apply search filter
      let filtered = laneCards;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (card) =>
            card.ID?.toLowerCase().includes(query) ||
            card.content.toLowerCase().includes(query) ||
            card.Tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      // Apply filter chips
      if (activeFilters.length > 0) {
        filtered = applyFilters(filtered, activeFilters, currentUserName);
      }

      result[lane] = filtered;
    });

    return result;
  }, [visibleLanes, cardsByLane, searchQuery, activeFilters, currentUserName]);

  return {
    filteredCardsByLane,
  };
}
