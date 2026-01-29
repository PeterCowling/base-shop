import type { Card, Idea, Lane } from "@/lib/types";

import { CompactCard } from "./CompactCard";
import { CompactIdea } from "./CompactIdea";
import { EmptyLaneState } from "./EmptyLaneState";

interface BoardLaneProps {
  lane: Lane;
  cards: Card[];
  ideas: Idea[];
  showBusinessTag: boolean;
}

interface LaneStats {
  total: number;
  highPriority: number;
  overdue: number;
}

/**
 * Get semantic background color for lane header
 * BOS-UX-11
 */
export function getLaneHeaderColor(lane: Lane): string {
  // Planning lanes (Inbox, Fact-finding, Planned): blue
  if (lane === "Inbox" || lane === "Fact-finding" || lane === "Planned") {
    return "bg-info-soft";
  }

  // Active lane (In progress): green
  if (lane === "In progress") {
    return "bg-success-soft";
  }

  // Blocked lane: yellow
  if (lane === "Blocked") {
    return "bg-warning-soft";
  }

  // Complete lanes (Done, Reflected): gray
  return "bg-muted";
}

/**
 * Calculate lane statistics
 * BOS-UX-11
 */
export function calculateLaneStats(cards: Card[]): LaneStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    total: cards.length,
    highPriority: cards.filter(
      (card) => card.Priority === "P0" || card.Priority === "P1"
    ).length,
    overdue: cards.filter((card) => {
      if (!card["Due-Date"]) return false;
      const dueDate = new Date(card["Due-Date"]);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }).length,
  };
}

/* eslint-disable ds/no-arbitrary-tailwind, ds/container-widths-only-at, ds/no-unsafe-viewport-units, ds/no-hardcoded-copy, ds/enforce-layout-primitives -- BOS-11: Phase 0 scaffold UI */
export function BoardLane({ lane, cards, ideas, showBusinessTag }: BoardLaneProps) {
  // Cards are already sorted by board-logic.ts (BOS-14)
  const stats = calculateLaneStats(cards);
  const headerColor = getLaneHeaderColor(lane);
  const totalCount = cards.length + ideas.length;

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-gray-100 rounded-lg">
      {/* Lane header - sticky */}
      <div
        className={`sticky top-0 z-10 px-4 py-3 border-b border-border ${headerColor}`}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            {lane}
          </h2>
          <span className="text-xs font-medium text-muted-foreground">
            {totalCount} {totalCount === 1 ? "card" : "cards"}
          </span>
        </div>

        {/* Lane stats */}
        {totalCount > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {stats.highPriority > 0 && (
              <span>{stats.highPriority} high priority</span>
            )}
            {stats.overdue > 0 && (
              <span className="text-danger">{stats.overdue} overdue</span>
            )}
          </div>
        )}
      </div>

      {/* Lane content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[calc(100vh-16rem)]">
        {/* Ideas (only in Inbox lane) */}
        {ideas.map((idea) => (
          <CompactIdea
            key={idea.ID || idea.filePath}
            idea={idea}
            showBusinessTag={showBusinessTag}
          />
        ))}

        {/* Cards */}
        {cards.map((card) => (
          <CompactCard
            key={card.ID}
            card={card}
            showBusinessTag={showBusinessTag}
          />
        ))}

        {/* Empty state */}
        {totalCount === 0 && (
          <EmptyLaneState lane={lane} hasFilters={false} />
        )}
      </div>
    </div>
  );
}
