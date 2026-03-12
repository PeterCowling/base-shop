"use client";

import { MessageSquare } from "lucide-react";

import type { InboxThreadSummary } from "@/services/useInbox";

import ThreadList from "./ThreadList";

interface PrimeColumnProps {
  threads: InboxThreadSummary[];
  selectedThreadId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (threadId: string) => void | Promise<void>;
}

export default function PrimeColumn({
  threads,
  selectedThreadId,
  loading,
  error,
  onSelect,
}: PrimeColumnProps) {
  const primeThreads = threads.filter((t) => t.channel !== "email");
  const showEmptyState = !loading && !error && primeThreads.length === 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center gap-2 px-1">
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Prime
        </span>
        {primeThreads.length > 0 && (
          <span className="ml-auto inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
            {primeThreads.length}
          </span>
        )}
      </div>

      {/* Channel-specific empty state */}
      {showEmptyState ? (
        <div className="rounded-2xl border border-border-1 bg-surface-2 shadow-sm">
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="rounded-full bg-surface-3 p-3 text-muted-foreground">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No Prime messages</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Prime campaign messages will appear here.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ThreadList
          threads={primeThreads}
          selectedThreadId={selectedThreadId}
          loading={loading}
          error={error}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
