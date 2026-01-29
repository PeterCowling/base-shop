import Link from "next/link";

import type { Card } from "@/lib/types";

import { formatDate } from "./date-utils";
import { PriorityBadge } from "./PriorityBadge";

interface CompactCardProps {
  card: Card;
  showBusinessTag: boolean;
}

export function CompactCard({ card, showBusinessTag }: CompactCardProps) {
  return (
    <Link
      href={`/cards/${card.ID}`}
      className="block rounded-lg border border-border-2 bg-card p-3 text-foreground transition-shadow hover:shadow-md"
    >
      {/* Title */}
      <h3 className="mb-2 line-clamp-2 text-sm font-medium text-foreground">
        {card.Title || card.ID}
      </h3>

      {/* Metadata row */}
      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge priority={card.Priority} />
        {showBusinessTag && card.Business && (
          <span className="rounded bg-info-soft px-2 py-0.5 text-xs text-info-foreground">
            {card.Business}
          </span>
        )}
      </div>

      {/* Owner & date */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{card.Owner}</span>
        {card.Updated && (
          <span>{formatDate(card.Updated)}</span>
        )}
      </div>

      {/* Proposed lane indicator */}
      {card["Proposed-Lane"] && card["Proposed-Lane"] !== card.Lane && (
        <div className="mt-2 border-t border-border-2 pt-2">
          <span className="text-xs font-medium text-warning-foreground">
            → Proposed: {card["Proposed-Lane"]}
          </span>
        </div>
      )}
    </Link>
  );
}
