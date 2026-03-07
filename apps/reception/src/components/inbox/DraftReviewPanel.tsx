"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, RefreshCw, Save, Send, ShieldAlert, XCircle } from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives";

import ConfirmModal from "@/components/common/ConfirmModal";
import type { InboxThreadDetail } from "@/services/useInbox";

import {
  buildDraftQualityBadge,
  findLatestInboundSender,
  inferReplySubject,
} from "./presentation";

interface DraftReviewPanelProps {
  threadDetail: InboxThreadDetail;
  savingDraft: boolean;
  regeneratingDraft: boolean;
  sendingDraft: boolean;
  resolvingThread: boolean;
  dismissingThread: boolean;
  onSave: (input: {
    subject?: string;
    recipientEmails?: string[];
    plainText: string;
    html?: string | null;
  }) => Promise<void>;
  onRegenerate: (force?: boolean) => Promise<void>;
  onSend: () => Promise<void>;
  onResolve: () => Promise<void>;
  onDismiss: () => Promise<void>;
}

function parseRecipientEmails(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function DraftReviewPanel({
  threadDetail,
  savingDraft,
  regeneratingDraft,
  sendingDraft,
  resolvingThread,
  dismissingThread,
  onSave,
  onRegenerate,
  onSend,
  onResolve,
  onDismiss,
}: DraftReviewPanelProps) {
  const currentDraft = threadDetail.currentDraft;
  const qualityBadge = buildDraftQualityBadge(currentDraft?.quality);
  const suggestedRecipient = findLatestInboundSender(threadDetail.messages);

  const [subject, setSubject] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [plainText, setPlainText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  useEffect(() => {
    setSubject(inferReplySubject(currentDraft?.subject ?? threadDetail.thread.subject));
    setRecipientInput(
      currentDraft?.recipientEmails.join(", ")
        ?? suggestedRecipient
        ?? "",
    );
    setPlainText(currentDraft?.plainText ?? "");
    setValidationError(null);
  }, [currentDraft, suggestedRecipient, threadDetail.thread.id, threadDetail.thread.subject]);

  const parsedRecipients = useMemo(
    () => parseRecipientEmails(recipientInput),
    [recipientInput],
  );

  const hasUnsavedChanges = useMemo(() => {
    const baselineSubject = inferReplySubject(currentDraft?.subject ?? threadDetail.thread.subject);
    const baselineRecipients = currentDraft?.recipientEmails.join(", ") ?? suggestedRecipient ?? "";
    const baselinePlainText = currentDraft?.plainText ?? "";

    return (
      subject !== baselineSubject
      || recipientInput !== baselineRecipients
      || plainText !== baselinePlainText
    );
  }, [
    currentDraft?.plainText,
    currentDraft?.recipientEmails,
    currentDraft?.subject,
    plainText,
    recipientInput,
    subject,
    suggestedRecipient,
    threadDetail.thread.subject,
  ]);

  const requiresManualDraft = threadDetail.thread.needsManualDraft && !currentDraft;
  const actionsDisabled = savingDraft || regeneratingDraft || sendingDraft || resolvingThread || dismissingThread;

  async function handleSave() {
    if (!subject.trim()) {
      setValidationError("Subject is required.");
      throw new Error("Subject is required.");
    }
    if (parsedRecipients.length === 0) {
      setValidationError("At least one recipient email is required.");
      throw new Error("At least one recipient email is required.");
    }
    if (parsedRecipients.some((value) => !isValidEmail(value))) {
      setValidationError("Recipients must be valid email addresses.");
      throw new Error("Recipients must be valid email addresses.");
    }
    if (!plainText.trim()) {
      setValidationError("Draft body cannot be empty.");
      throw new Error("Draft body cannot be empty.");
    }

    setValidationError(null);
    await onSave({
      subject,
      recipientEmails: parsedRecipients,
      plainText,
      html: null,
    });
  }

  async function handleConfirmSend() {
    try {
      if (hasUnsavedChanges) {
        await handleSave();
      }
      await onSend();
      setShowSendConfirm(false);
    } catch {
      // Keep the confirmation modal open so staff can correct the draft.
    }
  }

  async function handleConfirmRegenerate() {
    try {
      await onRegenerate(currentDraft?.status === "edited");
      setShowRegenerateConfirm(false);
    } catch {
      // Keep the confirmation modal open so staff can retry or cancel.
    }
  }

  async function handleConfirmResolve() {
    try {
      await onResolve();
      setShowResolveConfirm(false);
    } catch {
      // Keep the confirmation modal open so staff can retry or cancel.
    }
  }

  async function handleConfirmDismiss() {
    try {
      await onDismiss();
      setShowDismissConfirm(false);
    } catch {
      // Keep the confirmation modal open so staff can retry or cancel.
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
        <div className="border-b border-border-1 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Draft reply
            </h3>
            <Cluster gap={2}>
              {currentDraft?.templateUsed && (
                <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs text-muted-foreground">
                  {currentDraft.templateUsed}
                </span>
              )}
              {qualityBadge && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${qualityBadge.className}`}>
                  {qualityBadge.label}
                </span>
              )}
            </Cluster>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          {requiresManualDraft && (
            <div className="rounded-xl border border-warning-main/20 bg-warning-light px-3 py-2.5 text-sm text-warning-main">
              {threadDetail.thread.draftFailureMessage
                ? `Auto-draft failed: ${threadDetail.thread.draftFailureMessage} Write a manual reply below.`
                : "Auto-draft unavailable for this thread. Write a manual reply below."}
            </div>
          )}

          {validationError && (
            <div className="rounded-xl border border-error-main/20 bg-error-light px-3 py-2.5 text-sm text-error-main">
              {validationError}
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Subject
            </label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-lg border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary-main focus:ring-1 focus:ring-primary-main/30"
              placeholder="Re: Guest inquiry"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              To
            </label>
            <input
              value={recipientInput}
              onChange={(event) => setRecipientInput(event.target.value)}
              className="w-full rounded-lg border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary-main focus:ring-1 focus:ring-primary-main/30"
              placeholder="guest@example.com"
            />
          </div>

          {/* Body */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Message
            </label>
            <textarea
              value={plainText}
              onChange={(event) => setPlainText(event.target.value)}
              rows={8}
              className="w-full rounded-xl border border-border-1 bg-surface-2 px-3 py-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-primary-main focus:ring-1 focus:ring-primary-main/30"
              placeholder="Write the reply to send to the guest."
            />
          </div>

          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5 text-warning-main" />
              Unsaved changes. Save before sending.
            </div>
          )}
        </div>

        {/* Actions — primary send on the right, secondary on the left */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-1 px-4 py-3">
          <Cluster gap={2}>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={actionsDisabled || !hasUnsavedChanges}
              color="default"
              tone="outline"
              className="min-h-10 rounded-lg"
            >
              <Save className="mr-1.5 h-4 w-4" />
              {savingDraft ? "Saving..." : "Save"}
            </Button>

            <Button
              type="button"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={actionsDisabled}
              color="default"
              tone="outline"
              className="min-h-10 rounded-lg"
            >
              <RefreshCw className={`mr-1.5 h-4 w-4 ${regeneratingDraft ? "animate-spin" : ""}`} />
              {regeneratingDraft ? "Regenerating..." : "Regenerate"}
            </Button>

            <Button
              type="button"
              onClick={() => setShowResolveConfirm(true)}
              disabled={actionsDisabled}
              color="default"
              tone="outline"
              className="min-h-10 rounded-lg"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              {resolvingThread ? "Resolving..." : "Resolve"}
            </Button>
          </Cluster>

          <Cluster gap={3} className="ml-auto">
            <Button
              type="button"
              onClick={() => setShowDismissConfirm(true)}
              disabled={actionsDisabled}
              color="danger"
              tone="outline"
              className="min-h-10 rounded-lg"
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              {dismissingThread ? "Dismissing..." : "Not relevant"}
            </Button>

            <div className="h-8 border-l border-border-1" />

            <Button
              type="button"
              onClick={() => setShowSendConfirm(true)}
              disabled={actionsDisabled || parsedRecipients.length === 0 || !plainText.trim()}
              color="success"
              tone="solid"
              className="min-h-10 rounded-lg px-8"
            >
              <Send className="mr-1.5 h-4 w-4" />
              {sendingDraft ? "Sending..." : "Send"}
            </Button>
          </Cluster>
        </div>
      </section>

      <ConfirmModal
        isOpen={showRegenerateConfirm}
        title="Regenerate draft?"
        message={
          hasUnsavedChanges || currentDraft?.status === "edited"
            ? "This will overwrite the current draft with a fresh agent-generated reply."
            : "Generate a fresh agent draft for this thread?"
        }
        confirmLabel="Regenerate"
        onCancel={() => setShowRegenerateConfirm(false)}
        onConfirm={handleConfirmRegenerate}
      />

      <ConfirmModal
        isOpen={showSendConfirm}
        title="Send this reply?"
        message={`Send to ${parsedRecipients.join(", ") || "the guest"} with subject "${subject}"?`}
        confirmLabel="Send now"
        onCancel={() => setShowSendConfirm(false)}
        onConfirm={handleConfirmSend}
      />

      <ConfirmModal
        isOpen={showResolveConfirm}
        title="Resolve thread?"
        message="This thread will be removed from your active inbox."
        confirmLabel="Resolve"
        onCancel={() => setShowResolveConfirm(false)}
        onConfirm={handleConfirmResolve}
      />

      <ConfirmModal
        isOpen={showDismissConfirm}
        title="Mark as not relevant?"
        message="This thread will be archived. The sender details are recorded so similar emails can be reviewed later."
        confirmLabel="Not relevant"
        onCancel={() => setShowDismissConfirm(false)}
        onConfirm={handleConfirmDismiss}
      />
    </>
  );
}
