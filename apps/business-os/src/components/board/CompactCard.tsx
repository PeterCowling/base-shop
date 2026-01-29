import Link from "next/link";

import type { Card } from "@/lib/types";

import {
  formatDueDate,
  getDueDateColor,
  getOwnerInitials,
} from "./date-utils";
import { PriorityBadge } from "./PriorityBadge";

interface CompactCardProps {
  card: Card;
  showBusinessTag: boolean;
}

export function CompactCard({ card, showBusinessTag }: CompactCardProps) {
  const ownerInitials = getOwnerInitials(card.Owner);
  const dueDateColor = card["Due-Date"]
    ? getDueDateColor(card["Due-Date"])
    : "text-muted-foreground";

  const isBlocked = card.Blocked === true;
  const blockedReason = card["Blocked-Reason"];

  return (
    <Link
      href={`/cards/${card.ID}`}
      className={`block rounded-lg border p-3 text-foreground transition-shadow hover:shadow-md ${
        isBlocked
          ? "border-l-4 border-l-danger border-border-2 bg-danger-soft"
          : "border-border-2 bg-card"
      }`}
      title={isBlocked && blockedReason ? `Blocked: ${blockedReason}` : undefined}
    >
      {/* Title */}
      <h3 className="mb-2 line-clamp-2 text-sm font-medium text-foreground">
        {card.Title || card.ID}
      </h3>

      {/* Metadata row: Priority • Owner • Due Date */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <PriorityBadge priority={card.Priority} />

        {/* Blocked badge */}
        {isBlocked && (
          <span className="rounded bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger-foreground">
            BLOCKED
          </span>
        )}

        {/* Owner chip */}
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          {ownerInitials}
        </span>

        {/* Due date */}
        {card["Due-Date"] && (
          <span className={`text-xs font-medium ${dueDateColor}`}>
            Due {formatDueDate(card["Due-Date"])}
          </span>
        )}

        {/* Business tag (only on global board) */}
        {showBusinessTag && card.Business && (
          <span className="rounded bg-info-soft px-2 py-0.5 text-xs text-info-foreground">
            {card.Business}
          </span>
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
