import type { InboxThreadSummary } from "@/services/useInbox";

/**
 * How long since last sync before a thread is considered "stale".
 * Default: 24 hours.
 */
export const STALE_SYNC_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export type ThreadFilterKey =
  | "needs-draft"
  | "ready-to-send"
  | "sent"
  | "review-later"
  | "stale-sync";

export type ThreadFilterOption = {
  key: ThreadFilterKey;
  label: string;
};

export const THREAD_FILTER_OPTIONS: ThreadFilterOption[] = [
  { key: "needs-draft", label: "Needs draft" },
  { key: "ready-to-send", label: "Ready to send" },
  { key: "sent", label: "Sent" },
  { key: "review-later", label: "Review later" },
  { key: "stale-sync", label: "Stale sync" },
];

export function matchesFilter(
  thread: InboxThreadSummary,
  filter: ThreadFilterKey,
  now: number = Date.now(),
): boolean {
  switch (filter) {
    case "needs-draft":
      return thread.needsManualDraft === true;

    case "ready-to-send":
      return (
        thread.capabilities.supportsDraftSend
        && !thread.needsManualDraft
        && (thread.currentDraft?.status === "generated"
          || thread.currentDraft?.status === "edited"
          || thread.currentDraft?.status === "suggested"
          || thread.currentDraft?.status === "under_review")
      );

    case "sent":
      return thread.status === "sent";

    case "review-later":
      return thread.status === "review_later";

    case "stale-sync": {
      if (!thread.lastSyncedAt) {
        return true;
      }
      const syncAge = now - new Date(thread.lastSyncedAt).getTime();
      return syncAge > STALE_SYNC_THRESHOLD_MS;
    }

    default:
      return false;
  }
}

/**
 * Count threads matching each filter key.
 * Useful for displaying badge counts on filter tabs.
 */
export function countThreadsByFilter(
  threads: InboxThreadSummary[],
  now: number = Date.now(),
): Record<ThreadFilterKey, number> {
  const counts = {} as Record<ThreadFilterKey, number>;
  for (const option of THREAD_FILTER_OPTIONS) {
    counts[option.key] = threads.filter((t) => matchesFilter(t, option.key, now)).length;
  }
  return counts;
}

/**
 * Filter threads by a set of active filter keys.
 *
 * When no filters are active (empty set), all threads are returned unchanged.
 * When one or more filters are active, threads matching **any** active filter
 * are included (OR / union logic).
 */
export function applyThreadFilters(
  threads: InboxThreadSummary[],
  activeFilters: Set<ThreadFilterKey>,
  now: number = Date.now(),
): InboxThreadSummary[] {
  if (activeFilters.size === 0) {
    return threads;
  }

  return threads.filter((thread) => {
    for (const filter of activeFilters) {
      if (matchesFilter(thread, filter, now)) {
        return true;
      }
    }
    return false;
  });
}
