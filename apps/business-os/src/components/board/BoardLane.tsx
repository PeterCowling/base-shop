import type { Card, Idea, Lane } from "@/lib/types";

import { CompactCard } from "./CompactCard";
import { CompactIdea } from "./CompactIdea";

interface BoardLaneProps {
  lane: Lane;
  cards: Card[];
  ideas: Idea[];
  showBusinessTag: boolean;
}

/* eslint-disable ds/no-arbitrary-tailwind, ds/container-widths-only-at, ds/no-unsafe-viewport-units, ds/no-hardcoded-copy -- BOS-11: Phase 0 scaffold UI */
export function BoardLane({ lane, cards, ideas, showBusinessTag }: BoardLaneProps) {
  // Cards are already sorted by board-logic.ts (BOS-14)

  return (
    <div className="flex flex-col min-w-[320px] max-w-[320px] bg-gray-100 rounded-lg">
      {/* Lane header */}
      <div className="px-4 py-3 border-b border-gray-300">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {lane}
          </h2>
          <span className="text-xs font-medium text-gray-600">
            {cards.length + ideas.length}
          </span>
        </div>
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
        {cards.length === 0 && ideas.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No items in this lane
          </div>
        )}
      </div>
    </div>
  );
}
