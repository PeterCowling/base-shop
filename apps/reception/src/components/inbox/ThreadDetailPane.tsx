"use client";

import { AlertTriangle, MessageSquareText, User } from "lucide-react";

import type { InboxThreadDetail } from "@/services/useInbox";

import DraftReviewPanel from "./DraftReviewPanel";
import { formatInboxTimestamp } from "./presentation";

interface ThreadDetailPaneProps {
  threadDetail: InboxThreadDetail | null;
  loading: boolean;
  error: string | null;
  savingDraft: boolean;
  regeneratingDraft: boolean;
  sendingDraft: boolean;
  resolvingThread: boolean;
  onSaveDraft: (input: {
    subject?: string;
    recipientEmails?: string[];
    plainText: string;
    html?: string | null;
  }) => Promise<void>;
  onRegenerateDraft: (force?: boolean) => Promise<void>;
  onSendDraft: () => Promise<void>;
  onResolveThread: () => Promise<void>;
}

export default function ThreadDetailPane({
  threadDetail,
  loading,
  error,
  savingDraft,
  regeneratingDraft,
  sendingDraft,
  resolvingThread,
  onSaveDraft,
  onRegenerateDraft,
  onSendDraft,
  onResolveThread,
}: ThreadDetailPaneProps) {
  if (loading) {
    return (
      <section className="space-y-4 rounded-2xl border border-border-1 bg-surface p-5 shadow-sm">
        <div className="animate-pulse rounded-xl bg-surface-2 p-5">
          <div className="h-5 w-1/3 rounded-lg bg-surface-3" />
          <div className="mt-3 h-4 w-full rounded-lg bg-surface-3" />
          <div className="mt-2 h-4 w-4/5 rounded-lg bg-surface-3" />
        </div>
        <div className="animate-pulse rounded-xl bg-surface-2 p-5">
          <div className="h-5 w-1/4 rounded-lg bg-surface-3" />
          <div className="mt-3 h-32 rounded-lg bg-surface-3" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-border-1 bg-surface p-6 shadow-sm">
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
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
            <MessageSquareText className="h-7 w-7" />
          </div>
          <p className="text-base font-semibold text-foreground">Select a thread</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Conversation history, draft review, and send controls appear here once you choose a thread from the inbox list.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
        <div className="border-b border-border-1 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {threadDetail.thread.subject ?? "Untitled inquiry"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {threadDetail.thread.snippet ?? "No thread summary available."}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>Messages: {threadDetail.messages.length}</p>
              <p>Source: {threadDetail.messageBodiesSource.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {threadDetail.thread.guestBookingRef && (
          <div className="border-b border-border-1 px-5 py-4">
            <div className="flex items-start gap-3 rounded-2xl border border-primary-main/20 bg-primary-soft/40 px-4 py-3 text-sm">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-primary-main" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {[threadDetail.thread.guestFirstName, threadDetail.thread.guestLastName]
                    .filter(Boolean)
                    .join(" ") || "Guest"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Booking {threadDetail.thread.guestBookingRef}
                </p>
                {typeof threadDetail.metadata?.guestCheckIn === "string" &&
                  typeof threadDetail.metadata?.guestCheckOut === "string" && (
                  <p className="text-xs text-muted-foreground">
                    {threadDetail.metadata.guestCheckIn} &rarr; {threadDetail.metadata.guestCheckOut}
                  </p>
                )}
                {Array.isArray(threadDetail.metadata?.guestRoomNumbers) &&
                  threadDetail.metadata.guestRoomNumbers.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Room{threadDetail.metadata.guestRoomNumbers.length > 1 ? "s" : ""}: {(threadDetail.metadata.guestRoomNumbers as string[]).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {threadDetail.warning && (
          <div className="border-b border-border-1 px-5 py-4">
            <div className="flex items-start gap-3 rounded-2xl border border-warning-main/20 bg-warning-light px-4 py-3 text-sm text-warning-main">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{threadDetail.warning}</p>
            </div>
          </div>
        )}

        <div className="space-y-4 px-5 py-5">
          {threadDetail.messages.map((message) => (
            <article
              key={message.id}
              className={`rounded-2xl border px-4 py-4 ${
                message.direction === "outbound"
                  ? "border-primary-main/20 bg-primary-soft/60"
                  : "border-border-1 bg-surface-2"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {message.senderEmail ?? "Unknown sender"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    To: {message.recipientEmails.join(", ") || "Unknown recipients"}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatInboxTimestamp(message.sentAt)}
                </p>
              </div>

              <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                {message.bodyPlain ?? message.snippet ?? "No message body available."}
              </div>
            </article>
          ))}
        </div>
      </section>

      <DraftReviewPanel
        threadDetail={threadDetail}
        savingDraft={savingDraft}
        regeneratingDraft={regeneratingDraft}
        sendingDraft={sendingDraft}
        resolvingThread={resolvingThread}
        onSave={onSaveDraft}
        onRegenerate={onRegenerateDraft}
        onSend={onSendDraft}
        onResolve={onResolveThread}
      />
    </div>
  );
}
