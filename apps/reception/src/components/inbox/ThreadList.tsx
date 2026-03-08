"use client";

import { useCallback, useMemo, useState } from "react";
import { Clock, Filter, MailSearch } from "lucide-react";

import type { InboxThreadSummary } from "@/services/useInbox";

import FilterBar from "./FilterBar";
import { applyThreadFilters, type ThreadFilterKey } from "./filters";
import {
  buildInboxThreadBadge,
  formatInboxTimestamp,
} from "./presentation";

interface ThreadListProps {
  threads: InboxThreadSummary[];
  selectedThreadId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (threadId: string) => void | Promise<void>;
}

function GuestInitial({ thread }: { thread: InboxThreadSummary }) {
  const name = thread.guestFirstName ?? thread.subject;
  const initial = name?.charAt(0).toUpperCase() ?? "?";

  if (thread.guestFirstName) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-xs font-semibold text-primary-main">
        {initial}
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-xs font-medium text-muted-foreground">
      {initial}
    </div>
  );
}

export default function ThreadList({
  threads,
  selectedThreadId,
  loading,
  error,
  onSelect,
}: ThreadListProps) {
  const [activeFilters, setActiveFilters] = useState<Set<ThreadFilterKey>>(
    () => new Set(),
  );

  const handleToggleFilter = useCallback((key: ThreadFilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters(new Set());
  }, []);

  const filteredThreads = useMemo(
    () => applyThreadFilters(threads, activeFilters),
    [threads, activeFilters],
  );

  const hasActiveFilters = activeFilters.size > 0;

  return (
    <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
      <div className="border-b border-border-1 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Threads
          </h2>
          {!loading && threads.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
              {hasActiveFilters && (
                <>
                  <Filter className="h-3 w-3" />
                  {filteredThreads.length}/
                </>
              )}
              {threads.length}
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      {!loading && !error && threads.length > 0 && (
        <div className="border-b border-border-1 px-4 py-2">
          <FilterBar
            activeFilters={activeFilters}
            onToggle={handleToggleFilter}
            onClear={handleClearFilters}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-1 p-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex animate-pulse items-start gap-3 rounded-xl border-l-2 border-l-transparent p-3"
            >
              <div className="h-8 w-8 shrink-0 rounded-lg bg-surface-3" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 w-3/5 rounded-md bg-surface-3" />
                  <div className="h-5 w-14 rounded-full bg-surface-3" />
                </div>
                <div className="h-3 w-4/5 rounded-md bg-surface-3" />
                <div className="h-3 w-16 rounded-md bg-surface-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="p-3">
          <p className="rounded-xl border border-error-main/20 bg-error-light px-3 py-2 text-sm text-error-main">
            {error}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && threads.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="rounded-full bg-surface-2 p-3 text-muted-foreground">
            <MailSearch className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No active threads</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Hit refresh to pull new emails.
            </p>
          </div>
        </div>
      )}

      {/* Filtered empty state */}
      {!loading && !error && threads.length > 0 && hasActiveFilters && filteredThreads.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="rounded-full bg-surface-2 p-3 text-muted-foreground">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No threads match filters</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing a filter to see more threads.
            </p>
          </div>
        </div>
      )}

      {/* Thread list */}
      {!loading && !error && filteredThreads.length > 0 && (
        // eslint-disable-next-line ds/no-arbitrary-tailwind -- IDEA-DISPATCH-20260307130300-9043 viewport-relative scroll containment
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-2">
          <div className="space-y-0.5">
            {filteredThreads.map((thread) => {
              const badge = buildInboxThreadBadge(thread);
              const isSelected = thread.id === selectedThreadId;
              const guestName = thread.guestFirstName
                ? `${thread.guestFirstName}${thread.guestLastName ? ` ${thread.guestLastName}` : ""}`
                : null;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => void onSelect(thread.id)}
                  className={`group flex w-full items-start gap-3 rounded-xl border-l-2 px-3 py-2.5 text-left transition-colors ${badge.edgeColor} ${
                    isSelected
                      ? "bg-surface-2 ring-1 ring-primary-main/30"
                      : "hover:bg-surface-2/60"
                  }`}
                >
                  {/* Guest avatar */}
                  <GuestInitial thread={thread} />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Row 1: subject + badge */}
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {thread.subject ?? "Untitled inquiry"}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                        title={thread.needsManualDraft && thread.draftFailureMessage ? thread.draftFailureMessage : undefined}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Row 2: snippet */}
                    <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                      {thread.snippet ?? "No preview available."}
                    </p>

                    {/* Row 3: guest name + time */}
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {guestName && (
                        <span className="truncate font-medium text-primary-main">
                          {guestName}
                        </span>
                      )}
                      <span className="ml-auto inline-flex shrink-0 items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3" />
                        {formatInboxTimestamp(thread.latestMessageAt ?? thread.updatedAt)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
