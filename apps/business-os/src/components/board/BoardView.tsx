/**
 * BoardView Component
 * Main board view with search, filters, and lane display
 * BOS-UX-10: Integrated view with all board components
 */

/* eslint-disable ds/no-unsafe-viewport-units, ds/enforce-layout-primitives -- BOS-11: Phase 0 scaffold UI */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import useViewport from "@acme/design-system/hooks/useViewport";
import { Inline } from "@acme/design-system/primitives/Inline";
import { Stack } from "@acme/design-system/primitives/Stack";
import { useTranslations } from "@acme/i18n";

import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useRovingTabindex } from "@/hooks/useRovingTabindex";
import { calculateCardCountsByLane } from "@/lib/board-card-counts";
import type { User } from "@/lib/current-user";
import type { Business, Card, Lane } from "@/lib/types";

import { UserSwitcher } from "../user/UserSwitcher";

import { BoardLane } from "./BoardLane";
import {
  type BoardView as BoardViewType,
  BoardViewSwitcher,
  getLanesForView,
} from "./BoardViewSwitcher";
import { FilterChips, type FilterType } from "./FilterChips";
import { MobileLanePicker } from "./MobileLanePicker";
import { SearchBar } from "./SearchBar";
import { useBoardAutoRefresh } from "./useBoardAutoRefresh";

interface BoardViewProps {
  businessCode: string;
  businesses: Business[];
  cardsByLane: Record<Lane, Card[]>;
  currentUser: User;
}

export function BoardView({
  businessCode,
  businesses,
  cardsByLane,
  currentUser,
}: BoardViewProps) {
  const t = useTranslations();
  const viewport = useViewport();
  const currentBusiness = businesses.find((b) => b.id === businessCode);
  const isGlobal = businessCode === "global";

  // State for search, filters, and view
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [currentView, setCurrentView] = useState<BoardViewType>("all");
  const [activeMobileLane, setActiveMobileLane] = useState<Lane>("In progress");

  // All lanes for mobile picker
  const allLanes: Lane[] = useMemo(
    () => [
      "Inbox",
      "Fact-finding",
      "Planned",
      "In progress",
      "Blocked",
      "Done",
      "Reflected",
    ],
    []
  );

  // Get lanes for current view (mobile shows single lane, desktop shows filtered view)
  const visibleLanes = useMemo(() => {
    if (viewport === "mobile") {
      return [activeMobileLane];
    }
    return getLanesForView(currentView);
  }, [viewport, activeMobileLane, currentView]);

  // Apply search and filter logic
  const { filteredCardsByLane } = useBoardFilters({
    cardsByLane,
    visibleLanes,
    searchQuery,
    activeFilters,
    currentUserName: currentUser.name,
  });

  // Calculate card counts for mobile picker
  const cardCountByLane = useMemo(
    () => calculateCardCountsByLane(allLanes, cardsByLane),
    [cardsByLane, allLanes]
  );

  // Build grid for keyboard navigation (BOS-P2-05)
  const cardGrid = useMemo(() => {
    return visibleLanes.map((lane) => {
      const cards = filteredCardsByLane[lane] || [];
      return cards.map((card) => card.ID);
    });
  }, [visibleLanes, filteredCardsByLane]);

  // Roving tabindex for keyboard navigation (BOS-P2-05)
  const {
    focusedId,
    isFocusMode,
    focusElement,
    exitFocusMode,
    handleArrowKey,
    getTabIndex,
  } = useRovingTabindex(cardGrid);

  // Set up keyboard event listeners (BOS-P2-05)
  useKeyboardNavigation({ handleArrowKey, isFocusMode, exitFocusMode });

  // Auto-refresh board when cards change (BOS-D1-07)
  useBoardAutoRefresh({
    businessCode,
    enabled: true,
    pollingInterval: 30000, // 30 seconds
  });

  // Scroll to top when mobile lane changes (BOS-P2-03 Phase 4)
  useEffect(() => {
    if (viewport === "mobile") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeMobileLane, viewport]);

  return (
    <div className="min-h-screen bg-surface-1" suppressHydrationWarning>
      {/* Header */}
      <header className="bg-card border-b border-border-2 px-6 py-4 max-md:px-4">
        <div className="flex items-center justify-between max-md:flex-col max-md:items-start max-md:gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground max-md:text-xl">
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
          <div className="flex gap-2 max-md:flex-wrap max-md:w-full items-center">
            {/* User Switcher (dev mode only) */}
            <UserSwitcher currentUser={currentUser} />

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
              href="/ideas"
              className="px-4 py-2 text-sm font-medium text-foreground bg-surface-2 border border-border-2 rounded-md hover:bg-surface-3"
            >
              {t("businessOs.board.actions.ideas")}
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
      <div className="bg-card border-b border-border-2 px-6 py-4 max-md:px-4">
        <Stack gap={3}>
          {/* Search and View Switcher Row */}
          <Inline alignY="center" wrap={false} className="justify-between max-md:flex-col max-md:items-start max-md:gap-3">
            <div className="flex-1 max-md:w-full">
              <SearchBar value={searchQuery} onSearch={setSearchQuery} />
            </div>
            <div className="hidden md:block">
              <BoardViewSwitcher
                currentView={currentView}
                onViewChange={setCurrentView}
              />
            </div>
          </Inline>

          {/* Filter Chips Row */}
          <FilterChips
            activeFilters={activeFilters}
            onFiltersChange={setActiveFilters}
          />
        </Stack>
      </div>

      {/* Board lanes */}
      <div className="flex gap-4 p-6 overflow-x-auto md:flex-row max-md:flex-col max-md:overflow-y-auto max-md:px-4 max-md:pb-20 transition-opacity duration-200 ease-in-out">
        {visibleLanes.map((lane) => {
          const cards = filteredCardsByLane[lane] || [];

          return (
            <BoardLane
              key={lane}
              lane={lane}
              cards={cards}
              showBusinessTag={isGlobal}
              keyboardNav={{
                getTabIndex,
                isFocused: (cardId: string) => focusedId === cardId,
                onFocus: focusElement,
              }}
            />
          );
        })}
      </div>

      {/* Mobile lane picker - bottom tab bar */}
      {viewport === "mobile" && (
        <MobileLanePicker
          lanes={allLanes}
          activeLane={activeMobileLane}
          onLaneChange={setActiveMobileLane}
          cardCountByLane={cardCountByLane}
        />
      )}
    </div>
  );
}
