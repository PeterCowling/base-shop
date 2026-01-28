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
      className="block bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow"
    >
      {/* Title */}
      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
        {card.Title || card.ID}
      </h3>

      {/* Metadata row */}
      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge priority={card.Priority} />
        {showBusinessTag && card.Business && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
            {card.Business}
          </span>
        )}
      </div>

      {/* Owner & date */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">{card.Owner}</span>
        {card.Updated && (
          <span className="text-gray-500">{formatDate(card.Updated)}</span>
        )}
      </div>

      {/* Proposed lane indicator */}
      {card["Proposed-Lane"] && card["Proposed-Lane"] !== card.Lane && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <span className="text-xs text-orange-600 font-medium">
            → Proposed: {card["Proposed-Lane"]}
          </span>
        </div>
      )}
    </Link>
  );
}
