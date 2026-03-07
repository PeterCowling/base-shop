"use client";

import { MailSearch, User } from "lucide-react";

import { Cluster } from "@acme/design-system/primitives";

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
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Actionable threads
        </h2>
      </div>

      {loading && (
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-xl border border-border-1 bg-surface-2 p-4"
            >
              <div className="h-4 w-2/3 rounded-lg bg-surface-3" />
              <div className="mt-3 h-3 w-full rounded-lg bg-surface-3" />
              <div className="mt-2 h-3 w-1/2 rounded-lg bg-surface-3" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="p-4">
          <p className="rounded-xl border border-error-main/20 bg-error-light px-3 py-2 text-sm text-error-main">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && threads.length === 0 && (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="rounded-full bg-surface-2 p-4 text-muted-foreground">
            <MailSearch className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold text-foreground">No active inbox threads</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run a refresh to pull the latest admitted guest emails.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && threads.length > 0 && (
        <div className="max-h-70vh overflow-y-auto p-3">
          <div className="space-y-3">
            {threads.map((thread) => {
              const badge = buildInboxThreadBadge(thread);
              const isSelected = thread.id === selectedThreadId;

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => void onSelect(thread.id)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                    isSelected
                      ? "border-primary-main bg-primary-soft shadow-sm"
                      : "border-border-1 bg-surface hover:border-primary-main/30 hover:bg-surface-2"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {thread.subject ?? "Untitled inquiry"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {thread.snippet ?? "No message preview available."}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatInboxTimestamp(thread.latestMessageAt ?? thread.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {thread.guestFirstName && (
                    <Cluster gap={2} className="mt-2 text-xs text-primary-main">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5">
                        <User className="h-3 w-3" />
                        {thread.guestFirstName}
                        {thread.guestLastName ? ` ${thread.guestLastName}` : ""}
                      </span>
                    </Cluster>
                  )}

                  {(thread.latestAdmissionDecision || thread.latestAdmissionReason) && (
                    <Cluster gap={2} className="mt-3 text-xs text-muted-foreground">
                      {thread.latestAdmissionDecision && (
                        <span className="rounded-full bg-surface-3 px-2 py-1">
                          {thread.latestAdmissionDecision}
                        </span>
                      )}
                      {thread.latestAdmissionReason && (
                        <span className="rounded-full bg-surface-3 px-2 py-1">
                          {thread.latestAdmissionReason}
                        </span>
                      )}
                    </Cluster>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
