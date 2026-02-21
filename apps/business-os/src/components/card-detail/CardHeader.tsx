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
        <span className="text-sm font-mono text-muted">{card.ID}</span>
        <PriorityBadge priority={card.Priority} />
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            card.Lane === "Done"
              ? "bg-success-soft text-success-fg"
              : card.Lane === "Blocked"
                ? "bg-danger-soft text-danger-fg"
                : "bg-info-soft text-info-fg"
          }`}
        >
          {card.Lane}
        </span>
        {card["Proposed-Lane"] && card["Proposed-Lane"] !== card.Lane && (
          <span className="text-xs px-2 py-0.5 bg-warning-soft text-warning-fg rounded font-medium">
            → Proposed: {card["Proposed-Lane"]}
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-fg mb-2">
        {card.Title || card.ID}
      </h1>

      {/* Tags */}
      {card.Tags && card.Tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {card.Tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-surface-1 text-secondary rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
