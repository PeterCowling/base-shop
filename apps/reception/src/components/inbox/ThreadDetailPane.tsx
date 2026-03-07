"use client";

import { AlertTriangle, Calendar, MapPin, MessageSquareText, User } from "lucide-react";

import type { InboxThreadDetail } from "@/services/useInbox";

import DraftReviewPanel from "./DraftReviewPanel";
import { formatInboxTimestamp, stripQuotedContent } from "./presentation";

interface ThreadDetailPaneProps {
  threadDetail: InboxThreadDetail | null;
  loading: boolean;
  error: string | null;
  savingDraft: boolean;
  regeneratingDraft: boolean;
  sendingDraft: boolean;
  resolvingThread: boolean;
  dismissingThread: boolean;
  onSaveDraft: (input: {
    subject?: string;
    recipientEmails?: string[];
    plainText: string;
    html?: string | null;
  }) => Promise<void>;
  onRegenerateDraft: (force?: boolean) => Promise<void>;
  onSendDraft: () => Promise<void>;
  onResolveThread: () => Promise<void>;
  onDismissThread: () => Promise<void>;
}

export default function ThreadDetailPane({
  threadDetail,
  loading,
  error,
  savingDraft,
  regeneratingDraft,
  sendingDraft,
  resolvingThread,
  dismissingThread,
  onSaveDraft,
  onRegenerateDraft,
  onSendDraft,
  onResolveThread,
  onDismissThread,
}: ThreadDetailPaneProps) {
  if (loading) {
    return (
      <section className="space-y-3 rounded-2xl border border-border-1 bg-surface p-4 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-2/5 rounded-lg bg-surface-3" />
          <div className="h-4 w-full rounded-lg bg-surface-3" />
          <div className="h-4 w-3/4 rounded-lg bg-surface-3" />
          <div className="mt-4 h-32 rounded-xl bg-surface-2" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-border-1 bg-surface p-5 shadow-sm">
        <p className="rounded-xl border border-error-main/20 bg-error-light px-4 py-3 text-sm text-error-main">
          {error}
        </p>
      </section>
    );
  }

  if (!threadDetail) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border-2 bg-surface px-6 py-12 text-center shadow-sm">
        <div>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
            <MessageSquareText className="h-6 w-6" />
          </div>
          <p className="text-base font-semibold text-foreground">Select a thread</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Tap a thread from the list to view the conversation and review the draft reply.
          </p>
        </div>
      </section>
    );
  }

  const hasGuestContext = threadDetail.thread.guestBookingRef
    || threadDetail.thread.guestFirstName;

  return (
    <div className="space-y-3">
      {/* Thread header */}
      <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-foreground">
                {threadDetail.thread.subject ?? "Untitled inquiry"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {threadDetail.messages.length} message{threadDetail.messages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Guest context card */}
          {hasGuestContext && (
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-primary-soft/40 px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-primary-main" />
                {[threadDetail.thread.guestFirstName, threadDetail.thread.guestLastName]
                  .filter(Boolean)
                  .join(" ") || "Guest"}
              </span>
              {threadDetail.thread.guestBookingRef && (
                <span className="text-xs text-muted-foreground">
                  Booking {threadDetail.thread.guestBookingRef}
                </span>
              )}
              {typeof threadDetail.metadata?.guestCheckIn === "string"
                && typeof threadDetail.metadata?.guestCheckOut === "string" && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {threadDetail.metadata.guestCheckIn} &rarr; {threadDetail.metadata.guestCheckOut}
                </span>
              )}
              {Array.isArray(threadDetail.metadata?.guestRoomNumbers)
                && threadDetail.metadata.guestRoomNumbers.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Room{threadDetail.metadata.guestRoomNumbers.length > 1 ? "s" : ""}{" "}
                  {(threadDetail.metadata.guestRoomNumbers as string[]).join(", ")}
                </span>
              )}
            </div>
          )}
        </div>

        {threadDetail.warning && (
          <div className="border-t border-border-1 px-4 py-3">
            <div className="flex items-start gap-2 text-sm text-warning-main">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{threadDetail.warning}</p>
            </div>
          </div>
        )}
      </section>

      {/* Messages */}
      <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
        <div className="border-b border-border-1 px-4 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Conversation
          </h3>
        </div>
        {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- IDEA-DISPATCH-20260307130300-9040 viewport-relative scroll containment */}
        <div className="max-h-[50vh] space-y-3 overflow-y-auto p-3">
          {threadDetail.messages.map((message) => {
            const isOutbound = message.direction === "outbound";
            return (
              <article
                key={message.id}
                className={`rounded-xl px-4 py-3 ${
                  isOutbound
                    ? "ml-6 border border-primary-main/20 bg-primary-soft/50 border-l-2 border-l-primary-main"
                    : "mr-6 border border-border-1 bg-surface-2"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-medium text-foreground">
                    {message.senderEmail ?? "Unknown"}
                  </p>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {formatInboxTimestamp(message.sentAt)}
                  </p>
                </div>
                <div className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {message.bodyPlain ? stripQuotedContent(message.bodyPlain) : (message.snippet ?? "No body available.")}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Draft review */}
      <DraftReviewPanel
        threadDetail={threadDetail}
        savingDraft={savingDraft}
        regeneratingDraft={regeneratingDraft}
        sendingDraft={sendingDraft}
        resolvingThread={resolvingThread}
        dismissingThread={dismissingThread}
        onSave={onSaveDraft}
        onRegenerate={onRegenerateDraft}
        onSend={onSendDraft}
        onResolve={onResolveThread}
        onDismiss={onDismissThread}
      />
    </div>
  );
}
