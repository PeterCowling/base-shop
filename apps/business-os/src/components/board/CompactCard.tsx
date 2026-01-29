import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  /** Tabindex for roving tabindex pattern (0 for focused, -1 for others) */
  tabIndex?: 0 | -1;
  /** Whether this card is focused in keyboard navigation */
  isFocused?: boolean;
  /** Callback when card is clicked (for keyboard navigation) */
  onFocus?: () => void;
}

export function CompactCard({
  card,
  showBusinessTag,
  tabIndex = -1,
  isFocused = false,
  onFocus,
}: CompactCardProps) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const ownerInitials = getOwnerInitials(card.Owner);
  const dueDateColor = card["Due-Date"]
    ? getDueDateColor(card["Due-Date"])
    : "text-muted-foreground";

  const isBlocked = card.Blocked === true;
  const blockedReason = card["Blocked-Reason"];

  // Auto-scroll into view when focused
  useEffect(() => {
    if (isFocused && linkRef.current) {
      linkRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isFocused]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      router.push(`/cards/${card.ID}`);
    }
  };

  return (
    <Link
      ref={linkRef}
      href={`/cards/${card.ID}`}
      tabIndex={tabIndex}
      onClick={onFocus}
      onKeyDown={handleKeyDown}
      className={`block rounded-lg border p-3 text-foreground transition-all hover:shadow-md ${
        isFocused
          ? "ring-2 ring-primary ring-offset-2"
          : ""
      } ${
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
