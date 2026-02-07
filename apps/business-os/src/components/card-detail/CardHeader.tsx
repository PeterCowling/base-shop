import type { Card } from "@/lib/types";

import { PriorityBadge } from "../board/PriorityBadge";

interface CardHeaderProps {
  card: Card;
}

/* eslint-disable ds/enforce-layout-primitives -- BOS-12: Phase 0 scaffold UI */
export function CardHeader({ card }: CardHeaderProps) {
  return (
    <div>
      {/* ID and priority */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-mono text-gray-600">{card.ID}</span>
        <PriorityBadge priority={card.Priority} />
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            card.Lane === "Done"
              ? "bg-green-100 text-green-800"
              : card.Lane === "Blocked"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
          }`}
        >
          {card.Lane}
        </span>
        {card["Proposed-Lane"] && card["Proposed-Lane"] !== card.Lane && (
          <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-medium">
            → Proposed: {card["Proposed-Lane"]}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        {card.Title || card.ID}
      </h1>

      {/* Tags */}
      {card.Tags && card.Tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {card.Tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
