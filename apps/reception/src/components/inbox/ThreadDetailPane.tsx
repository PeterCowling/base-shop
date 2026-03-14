"use client";

import { AlertTriangle, Calendar, ChevronUp, Loader2, MapPin, User } from "lucide-react";

import { Button } from "@acme/design-system/atoms";

import type { InboxMessage, InboxThreadDetail } from "@/services/useInbox";

import DraftReviewPanel from "./DraftReviewPanel";
import { formatInboxTimestamp, stripQuotedContent } from "./presentation";

interface ThreadDetailPaneProps {
  threadDetail: InboxThreadDetail | null;
  loading: boolean;
  error: string | null;
  loadingMoreMessages: boolean;
  savingDraft: boolean;
  regeneratingDraft: boolean;
  sendingDraft: boolean;
  resolvingThread: boolean;
  dismissingThread: boolean;
  onLoadMoreMessages: () => Promise<void>;
  onSaveDraft: (input: {
    subject?: string;
    recipientEmails?: string[];
    plainText: string;
    html?: string | null;
  }) => Promise<void>;
  onRegenerateDraft: (force?: boolean) => Promise<void>;
  onSendDraft: () => Promise<void>;
  onResolveThread: () => Promise<void>;
  onDismissThread: () => Promise<{ thread: InboxThreadDetail["thread"]; gmailMarkedRead: boolean }>;
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
            : "bg-surface-3 text-foreground/70"
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
          <span className="shrink-0 text-xs font-medium tabular-nums text-foreground/50">
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

function formatCampaignStatus(status: string): string {
  return status.replace(/_/g, " ");
}

// Non-uniform gap-x/gap-y layout — DS Inline/Cluster only supports symmetric gaps
const campaignMetaRowClass = "flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground/60";

export default function ThreadDetailPane({
  threadDetail,
  loading,
  error,
  loadingMoreMessages,
  savingDraft,
  regeneratingDraft,
  sendingDraft,
  resolvingThread,
  dismissingThread,
  onLoadMoreMessages,
  onSaveDraft,
  onRegenerateDraft,
  onSendDraft,
  onResolveThread,
  onDismissThread,
}: ThreadDetailPaneProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-border-1 bg-surface-2 p-5 shadow-sm">
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
      <section className="rounded-2xl border border-border-1 bg-surface-2 p-5 shadow-sm">
        <p className="rounded-xl border border-error-main/20 bg-error-light px-4 py-3 text-sm text-error-main">
          {error}
        </p>
      </section>
    );
  }

  if (!threadDetail) {
    return (
      <section className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border-2 bg-surface-2 px-6 py-16 text-center shadow-sm">
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
      <section className="rounded-2xl border border-border-1 bg-surface-2 shadow-sm">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {threadDetail.thread.subject ?? "Untitled inquiry"}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-foreground/60">
              {threadDetail.thread.channelLabel}
            </span>
            {threadDetail.campaign && (
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-primary-main">
                {formatCampaignStatus(threadDetail.campaign.status)}
              </span>
            )}
            <p className="text-xs font-medium text-foreground/60">
              {threadDetail.totalMessages ?? threadDetail.messages.length} message{(threadDetail.totalMessages ?? threadDetail.messages.length) !== 1 ? "s" : ""}
              {(threadDetail.hasMore ?? (typeof threadDetail.totalMessages === "number"
                && threadDetail.messages.length < threadDetail.totalMessages))
                && ` (showing ${threadDetail.messages.length})`}
            </p>
          </div>

          {threadDetail.campaign && (
            <div className="mt-3 rounded-xl border border-border-1 bg-surface-2 px-3 py-2">
              <div className={campaignMetaRowClass}>
                <span className="font-medium text-foreground">
                  {threadDetail.campaign.title ?? "Prime campaign"}
                </span>
                <span>
                  Audience: {threadDetail.campaign.audience}
                </span>
                <span>
                  Targets: {threadDetail.campaign.targetSummary.total}
                </span>
                <span>
                  Projected: {threadDetail.campaign.deliverySummary.projected}
                </span>
                {threadDetail.campaign.deliverySummary.failed > 0 && (
                  <span className="text-error-main">
                    Failed: {threadDetail.campaign.deliverySummary.failed}
                  </span>
                )}
              </div>
            </div>
          )}

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
                <span className="text-xs font-medium text-foreground/60">
                  #{threadDetail.thread.guestBookingRef}
                </span>
              )}
              {typeof threadDetail.metadata?.guestCheckIn === "string"
                && typeof threadDetail.metadata?.guestCheckOut === "string" && (
                <span className="inline-flex items-center gap-1 text-xs text-foreground/60">
                  <Calendar className="h-3 w-3" />
                  {threadDetail.metadata.guestCheckIn} &rarr; {threadDetail.metadata.guestCheckOut}
                </span>
              )}
              {(() => {
                const rooms = Array.isArray(threadDetail.metadata?.guestRoomNumbers)
                  ? (threadDetail.metadata.guestRoomNumbers as unknown[]).filter(
                      (n): n is string => typeof n === "string",
                    )
                  : [];
                return rooms.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-foreground/60">
                    <MapPin className="h-3 w-3" />
                    Room{rooms.length > 1 ? "s" : ""}{" "}
                    {rooms.join(", ")}
                  </span>
                );
              })()}
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
            {(threadDetail.hasMore ?? (typeof threadDetail.totalMessages === "number"
              && threadDetail.messages.length < threadDetail.totalMessages)) && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  color="default"
                  tone="ghost"
                  disabled={loadingMoreMessages}
                  onClick={() => void onLoadMoreMessages()}
                  className="gap-1.5 rounded-full bg-surface-3 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:bg-surface-elevated hover:text-foreground disabled:opacity-50"
                >
                  {loadingMoreMessages ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Load earlier messages
                    </>
                  )}
                </Button>
              </div>
            )}
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
