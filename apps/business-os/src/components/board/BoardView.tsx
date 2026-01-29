/**
 * BoardView Component
 * Main board view with search, filters, and lane display
 * BOS-UX-10: Integrated view with all board components
 */

/* eslint-disable ds/no-unsafe-viewport-units, ds/enforce-layout-primitives -- BOS-11: Phase 0 scaffold UI */
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { useTranslations } from "@acme/i18n";

import type { Business, Card, Idea, Lane } from "@/lib/types";

import { BoardLane } from "./BoardLane";
import { type BoardView as BoardViewType,BoardViewSwitcher, getLanesForView } from "./BoardViewSwitcher";
import { applyFilters, FilterChips, type FilterType } from "./FilterChips";
import { SearchBar } from "./SearchBar";

interface BoardViewProps {
  businessCode: string;
  businesses: Business[];
  cardsByLane: Record<Lane, Card[]>;
  inboxIdeas: Idea[];
}

export function BoardView({
  businessCode,
  businesses,
  cardsByLane,
  inboxIdeas,
}: BoardViewProps) {
  const t = useTranslations();
  const currentBusiness = businesses.find((b) => b.id === businessCode);
  const isGlobal = businessCode === "global";

  // State for search, filters, and view
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [currentView, setCurrentView] = useState<BoardViewType>("all");

  // Get lanes for current view
  const visibleLanes = useMemo(
    () => getLanesForView(currentView),
    [currentView]
  );

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
        filtered = applyFilters(filtered, activeFilters, "Pete"); // TODO: Get current user
      }

      result[lane] = filtered;
    });

    return result;
  }, [visibleLanes, cardsByLane, searchQuery, activeFilters]);

  // Filter ideas based on search
  const filteredIdeas = useMemo(() => {
    if (!searchQuery) return inboxIdeas;

    const query = searchQuery.toLowerCase();
    return inboxIdeas.filter(
      (idea) =>
        idea.ID?.toLowerCase().includes(query) ||
        idea.content.toLowerCase().includes(query) ||
        idea.Tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [inboxIdeas, searchQuery]);

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Header */}
      <header className="bg-card border-b border-border-2 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isGlobal
                ? t("businessOs.board.titles.global")
                : currentBusiness?.name || businessCode}
            </h1>
            {isGlobal ? (
              <p className="text-sm text-muted-foreground mt-1">
                {t("businessOs.board.descriptions.highPriority")}
              </p>
            ) : (
              currentBusiness?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentBusiness.description}
                </p>
              )
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/cards/new"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
            >
              {t("businessOs.board.actions.newCard")}
            </Link>
            <Link
              href="/ideas/new"
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
            >
              {t("businessOs.board.actions.newIdea")}
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
            >
              {t("businessOs.board.actions.home")}
            </Link>
            {!isGlobal && (
              <Link
                href="/boards/global"
                className="px-4 py-2 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
              >
                {t("businessOs.board.actions.globalBoard")}
              </Link>
            )}
          </div>
        </div>

        {/* Business selector for global board */}
        {isGlobal && (
          <div className="mt-4 flex gap-2">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/boards/${business.id}`}
                className="px-3 py-1 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
              >
                {business.id}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Toolbar: Search, Filters, View Switcher */}
      <div className="bg-card border-b border-border-2 px-6 py-4">
        <Stack gap={3}>
          {/* Search and View Switcher Row */}
          <Inline alignY="center" wrap={false} className="justify-between">
            <div className="flex-1">
              <SearchBar value={searchQuery} onSearch={setSearchQuery} />
            </div>
            <BoardViewSwitcher
              currentView={currentView}
              onViewChange={setCurrentView}
            />
          </Inline>

          {/* Filter Chips Row */}
          <FilterChips
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
          />
        </Stack>
      </div>

      {/* Board lanes */}
      <div className="flex gap-4 p-6 overflow-x-auto">
        {visibleLanes.map((lane) => {
          const cards = filteredCardsByLane[lane] || [];
          // For Inbox lane, show ideas too
          const ideas = lane === "Inbox" ? filteredIdeas : [];

          return (
            <BoardLane
              key={lane}
              lane={lane}
              cards={cards}
              ideas={ideas}
              showBusinessTag={isGlobal}
            />
          );
        })}
      </div>
    </div>
  );
}
