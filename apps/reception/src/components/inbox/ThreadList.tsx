"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Filter, MailSearch } from "lucide-react";

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
  const [newThreadIds, setNewThreadIds] = useState<Set<string>>(() => new Set());
  const previousThreadsRef = useRef<Array<{ id: string; latestMessageAt: string | null; updatedAt: string }>>([]);

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
  const showInitialSkeleton = loading && threads.length === 0;

  useEffect(() => {
    const previousThreads = previousThreadsRef.current;
    previousThreadsRef.current = threads.map((thread) => ({
      id: thread.id,
      latestMessageAt: thread.latestMessageAt,
      updatedAt: thread.updatedAt,
    }));

    if (previousThreads.length === 0) {
      return;
    }

    const previousById = new Map(previousThreads.map((thread) => [thread.id, thread]));
    const arrivals = threads
      .filter((thread) => {
        const previous = previousById.get(thread.id);
        if (!previous) {
          return true;
        }

        return (
          previous.latestMessageAt !== thread.latestMessageAt
          || previous.updatedAt !== thread.updatedAt
        );
      })
      .map((thread) => thread.id);

    if (arrivals.length === 0) {
      return;
    }

    setNewThreadIds((prev) => {
      const next = new Set(prev);
      arrivals.forEach((id) => next.add(id));
      return next;
    });

    const timeoutId = window.setTimeout(() => {
      setNewThreadIds((prev) => {
        const next = new Set(prev);
        arrivals.forEach((id) => next.delete(id));
        return next;
      });
    }, 4_000);

    return () => window.clearTimeout(timeoutId);
  }, [threads]);

  return (
    <section className="rounded-2xl border border-border-1 bg-surface-2 shadow-sm">
      <div className="border-b border-border-1 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Threads
          </h2>
          {threads.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground/70">
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
      {!error && threads.length > 0 && (
        <div className="border-b border-border-1 px-4 py-2">
          <FilterBar
            activeFilters={activeFilters}
            onToggle={handleToggleFilter}
            onClear={handleClearFilters}
          />
        </div>
      )}

      {/* Loading skeleton */}
      {showInitialSkeleton && (
        <div className="divide-y divide-border-1">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="animate-pulse px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="h-3.5 w-3/5 rounded-lg bg-surface-3" />
                <div className="h-3 w-10 rounded-lg bg-surface-3" />
              </div>
              <div className="mt-1.5 h-3 w-4/5 rounded-lg bg-surface-3" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!showInitialSkeleton && error && (
        <div className="p-3">
          <p className="rounded-xl border border-error-main/20 bg-error-light px-3 py-2 text-sm text-error-main">
            {error}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!showInitialSkeleton && !error && threads.length === 0 && (
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
      {!showInitialSkeleton && !error && threads.length > 0 && hasActiveFilters && filteredThreads.length === 0 && (
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
      {!error && filteredThreads.length > 0 && (
        // eslint-disable-next-line ds/no-arbitrary-tailwind -- IDEA-DISPATCH-20260307130300-9043 viewport-relative scroll containment
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <div className="divide-y divide-border-1">
            {filteredThreads.map((thread) => {
              const badge = buildInboxThreadBadge(thread);
              const isSelected = thread.id === selectedThreadId;
              const isNewThread = newThreadIds.has(thread.id);
              const time = formatInboxTimestamp(thread.latestMessageAt ?? thread.updatedAt);

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => void onSelect(thread.id)}
                  className={`group w-full border-l-2 px-4 py-2.5 text-left transition-colors duration-700 ${badge.edgeColor} ${
                    isSelected
                      ? "bg-surface-elevated"
                      : "hover:bg-table-row-hover"
                  } ${isNewThread ? "bg-primary-soft/20" : ""}`}
                >
                  {/* Row 1: badge + time */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-lg px-1.5 py-px text-xs font-medium leading-tight ${badge.className}`}
                      title={thread.needsManualDraft && thread.draftFailureMessage ? thread.draftFailureMessage : undefined}
                    >
                      {badge.label}
                    </span>
                    <span className="rounded-lg bg-surface-3 px-1.5 py-px text-xs font-semibold leading-tight text-foreground/60">
                      {thread.channelLabel}
                    </span>
                    {thread.guestFirstName && (
                      <span className="truncate text-xs font-medium text-primary-main">
                        {thread.guestFirstName}{thread.guestLastName ? ` ${thread.guestLastName}` : ""}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs font-medium tabular-nums text-foreground/60">
                      {time}
                    </span>
                  </div>

                  {/* Row 2: subject */}
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {thread.subject ?? "Untitled inquiry"}
                  </p>

                  {/* Row 3: snippet */}
                  <p className="mt-0.5 truncate text-xs text-foreground/50">
                    {thread.snippet ?? "No preview available."}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
