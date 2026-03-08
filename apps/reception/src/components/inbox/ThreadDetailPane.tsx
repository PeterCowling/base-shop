"use client";

import { AlertTriangle, Calendar, MapPin, User } from "lucide-react";

import type { InboxMessage, InboxThreadDetail } from "@/services/useInbox";

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

function senderDisplayName(message: InboxMessage, threadDetail: InboxThreadDetail): string {
  if (message.direction === "outbound") {
    return "Brikette";
  }
  const guest = [threadDetail.thread.guestFirstName, threadDetail.thread.guestLastName]
    .filter(Boolean)
    .join(" ");
  return guest || message.senderEmail?.split("@")[0] || "Guest";
}

function MessageBubble({
  message,
  threadDetail,
}: {
  message: InboxMessage;
  threadDetail: InboxThreadDetail;
}) {
  const isOutbound = message.direction === "outbound";
  const displayName = senderDisplayName(message, threadDetail);
  const initial = displayName.charAt(0).toUpperCase();
  const body = message.bodyPlain
    ? stripQuotedContent(message.bodyPlain)
    : (message.snippet ?? "No body available.");

  return (
    <article className={`flex gap-3 ${isOutbound ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
          isOutbound
            ? "bg-primary-soft text-primary-main"
            : "bg-surface-3 text-muted-foreground"
        }`}
      >
        {initial}
      </div>

      {/* Bubble */}
      <div
        className={`min-w-0 max-w-prose rounded-2xl px-4 py-3 ${
          isOutbound
            ? "rounded-tr-md bg-primary-soft/60"
            : "rounded-tl-md bg-surface-2"
        }`}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className={`text-xs font-medium ${isOutbound ? "text-primary-main" : "text-foreground"}`}>
            {displayName}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatInboxTimestamp(message.sentAt)}
          </span>
        </div>
        <div className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
          {body}
        </div>
      </div>
    </article>
  );
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
      <section className="rounded-2xl border border-border-1 bg-surface p-5 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-2/5 rounded-md bg-surface-3" />
          <div className="h-3 w-24 rounded-md bg-surface-3" />
          <div className="mt-6 space-y-3">
            <div className="mr-16 h-20 rounded-2xl rounded-tl-md bg-surface-2" />
            <div className="ml-16 h-16 rounded-2xl rounded-tr-md bg-surface-2" />
            <div className="mr-16 h-14 rounded-2xl rounded-tl-md bg-surface-2" />
          </div>
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
      <section className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border-2 bg-surface px-6 py-16 text-center shadow-sm">
        <div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
            <User className="h-5 w-5" />
          </div>
          <p className="text-base font-semibold text-foreground">Select a thread</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
            Choose a conversation from the list to view messages and draft a reply.
          </p>
        </div>
      </section>
    );
  }

  const hasGuestContext = threadDetail.thread.guestBookingRef
    || threadDetail.thread.guestFirstName;

  return (
    <div className="space-y-3">
      {/* Unified thread header + conversation card */}
      <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {threadDetail.thread.subject ?? "Untitled inquiry"}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {threadDetail.messages.length} message{threadDetail.messages.length !== 1 ? "s" : ""}
          </p>

          {/* Guest context — compact inline */}
          {hasGuestContext && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-surface-2 px-3 py-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-primary-main" />
                {[threadDetail.thread.guestFirstName, threadDetail.thread.guestLastName]
                  .filter(Boolean)
                  .join(" ") || "Guest"}
              </span>
              {threadDetail.thread.guestBookingRef && (
                <span className="text-xs text-muted-foreground">
                  #{threadDetail.thread.guestBookingRef}
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

        {/* Warning banner */}
        {threadDetail.warning && (
          <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl border border-warning-main/20 bg-warning-light px-3 py-2 text-sm text-warning-main">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{threadDetail.warning}</p>
          </div>
        )}

        {/* Conversation — chat-style bubbles */}
        <div className="border-t border-border-1">
          {/* eslint-disable-next-line ds/no-arbitrary-tailwind -- IDEA-DISPATCH-20260307130300-9040 viewport-relative scroll containment */}
          <div className="max-h-[50vh] space-y-4 overflow-y-auto px-5 py-4">
            {threadDetail.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                threadDetail={threadDetail}
              />
            ))}
          </div>
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
