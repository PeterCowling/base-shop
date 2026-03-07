"use client";

import { Clock, MailSearch, User } from "lucide-react";

import type { InboxThreadSummary } from "@/services/useInbox";

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
  return (
    <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
      <div className="border-b border-border-1 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Threads
          </h2>
          {!loading && threads.length > 0 && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {threads.length}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-2 p-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl bg-surface-2 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded-lg bg-surface-3" />
                  <div className="h-3 w-full rounded-lg bg-surface-3" />
                </div>
                <div className="h-5 w-16 rounded-full bg-surface-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="p-3">
          <p className="rounded-xl border border-error-main/20 bg-error-light px-3 py-2 text-sm text-error-main">
            {error}
          </p>
        </div>
      )}

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

      {!loading && !error && threads.length > 0 && (
        // eslint-disable-next-line ds/no-arbitrary-tailwind -- IDEA-DISPATCH-20260307130300-9043 viewport-relative scroll containment
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-2">
          <div className="space-y-1">
            {threads.map((thread) => {
              const badge = buildInboxThreadBadge(thread);
              const isSelected = thread.id === selectedThreadId;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => void onSelect(thread.id)}
                  className={`group w-full rounded-xl px-3 py-3 text-left transition ${
                    isSelected
                      ? "bg-primary-soft/80 ring-1 ring-primary-main/40"
                      : "hover:bg-surface-2"
                  }`}
                >
                  {/* Top row: subject + badge */}
                  <div className="flex items-start justify-between gap-2">
                    <p className={`truncate text-sm font-medium ${
                      isSelected ? "text-foreground" : "text-foreground group-hover:text-foreground"
                    }`}>
                      {thread.subject ?? "Untitled inquiry"}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Snippet */}
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {thread.snippet ?? "No preview available."}
                  </p>

                  {/* Bottom row: guest name + timestamp */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {thread.guestFirstName ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary-main">
                        <User className="h-3 w-3" />
                        {thread.guestFirstName}
                        {thread.guestLastName ? ` ${thread.guestLastName}` : ""}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatInboxTimestamp(thread.latestMessageAt ?? thread.updatedAt)}
                    </span>
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
