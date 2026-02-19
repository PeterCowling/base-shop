/**
 * organize-query.ts
 *
 * Builds the Gmail search query for handleOrganizeInbox.
 *
 * Transitional fix: label-absence query scoped to the last 7 days.
 * Long-term target: Gmail filter or history-based ingestion via
 * `users.history.list` + `lastHistoryId`.
 * See docs/plans/email-system-design-gaps/fact-find.md §Decision 1.
 */

export type OrganizeQueryMode = "unread" | "label-absence";

export interface OrganizeQueryOptions {
  startDate?: string; // YYYY-MM-DD — if provided, use after:DATE instead of newer_than:7d
  daysBack?: number;  // number of days for newer_than (default: 7)
}

/**
 * Build the Gmail search query for the organize-inbox tool.
 *
 * label-absence mode: excludes all terminal Brikette labels so emails that have
 * been read (but not yet processed) are still picked up. Returns a query like:
 *   in:inbox newer_than:7d -label:Brikette/Queue/In-Progress -label:Brikette/Queue/Deferred ...
 *
 * unread mode (legacy): returns `is:unread in:inbox` (or with after:DATE).
 */
export function buildOrganizeQuery(
  terminalLabels: string[],
  mode: OrganizeQueryMode,
  options?: OrganizeQueryOptions,
): string {
  if (mode === "unread") {
    if (options?.startDate) {
      return `in:inbox after:${options.startDate}`;
    }
    return "is:unread in:inbox";
  }

  // label-absence mode
  const timeClause = options?.startDate
    ? `after:${options.startDate}`
    : `newer_than:${options?.daysBack ?? 7}d`;

  const exclusions = terminalLabels.map(label => `-label:${label}`);

  return `in:inbox ${timeClause} ${exclusions.join(" ")}`.trimEnd();
}
