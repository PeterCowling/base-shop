/**
 * FilterChips Component
 * Clickable filter chips for board cards with AND logic
 * BOS-UX-09
 */

/* eslint-disable ds/enforce-layout-primitives, ds/min-tap-size -- BOS-UX-09 Phase 0 scaffold UI [ttl=2026-03-31] */
"use client";

import type { Card } from "@/lib/types";

export type FilterType =
  | "myItems"
  | "overdue"
  | "highPriority"
  | "blocked"
  | "untriaged";

export interface FilterChipsProps {
  activeFilters: FilterType[];
  onFiltersChange: (filters: FilterType[]) => void;
  currentUser?: string;
}

interface FilterChipConfig {
  id: FilterType;
  label: string;
}

const FILTER_CHIPS: FilterChipConfig[] = [
  { id: "myItems", label: "My items" },
  { id: "overdue", label: "Overdue" },
  { id: "highPriority", label: "P0/P1" },
  { id: "blocked", label: "Blocked" },
  { id: "untriaged", label: "Untriaged" },
];

/**
 * Apply filters to cards with AND logic
 * BOS-UX-09
 */
export function applyFilters(
  cards: Card[],
  activeFilters: FilterType[],
  currentUser: string
): Card[] {
  if (activeFilters.length === 0) {
    return cards;
  }

  return cards.filter((card) => {
    // All active filters must pass (AND logic)
    return activeFilters.every((filter) => {
      switch (filter) {
        case "myItems":
          return card.Owner === currentUser;

        case "overdue": {
          if (!card["Due-Date"]) return false;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(card["Due-Date"]);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate < today;
        }

        case "highPriority":
          return card.Priority === "P0" || card.Priority === "P1";

        case "blocked":
          return card.Blocked === true;

        case "untriaged":
          return (
            card.Lane === "Inbox" &&
            (card.Priority === "P3" ||
              card.Priority === "P4" ||
              card.Priority === "P5")
          );

        default:
          return true;
      }
    });
  });
}

export function FilterChips({
  activeFilters,
  onFiltersChange,
  currentUser: _currentUser = "Pete",
}: FilterChipsProps) {
  const toggleFilter = (filterId: FilterType) => {
    if (activeFilters.includes(filterId)) {
      onFiltersChange(activeFilters.filter((f) => f !== filterId));
    } else {
      onFiltersChange([...activeFilters, filterId]);
    }
  };

  const clearAll = () => {
    onFiltersChange([]);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {FILTER_CHIPS.map((chip) => {
        const isActive = activeFilters.includes(chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => toggleFilter(chip.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            aria-pressed={isActive}
          >
            {chip.label}
          </button>
        );
      })}

      {/* Clear all button */}
      {activeFilters.length > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
