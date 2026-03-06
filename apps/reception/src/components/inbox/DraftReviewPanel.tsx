"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Save, Send, ShieldAlert } from "lucide-react";

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
  onSave: (input: {
    subject?: string;
    recipientEmails?: string[];
    plainText: string;
    html?: string | null;
  }) => Promise<void>;
  onRegenerate: (force?: boolean) => Promise<void>;
  onSend: () => Promise<void>;
  onResolve: () => Promise<void>;
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
  onSave,
  onRegenerate,
  onSend,
  onResolve,
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
  const actionsDisabled = savingDraft || regeneratingDraft || sendingDraft || resolvingThread;

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

  return (
    <>
      <section className="rounded-2xl border border-border-1 bg-surface shadow-sm">
        <div className="border-b border-border-1 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Draft review</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Review, edit, regenerate, then explicitly send through Gmail.
              </p>
            </div>

            <Cluster gap={2}>
              {currentDraft?.templateUsed && (
                <span className="rounded-full bg-surface-3 px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {currentDraft.templateUsed}
                </span>
              )}
              {qualityBadge && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${qualityBadge.className}`}>
                  {qualityBadge.label}
                </span>
              )}
            </Cluster>
          </div>
        </div>

        <div className="space-y-4 px-5 py-5">
          {requiresManualDraft && (
            <div className="rounded-2xl border border-warning-main/20 bg-warning-light px-4 py-3 text-sm text-warning-main">
              The agent could not safely generate a reply for this thread. Start from a blank manual draft.
            </div>
          )}

          {validationError && (
            <div className="rounded-2xl border border-error-main/20 bg-error-light px-4 py-3 text-sm text-error-main">
              {validationError}
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Subject
            </span>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="w-full rounded-xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary-main"
              placeholder="Re: Guest inquiry"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Recipients
            </span>
            <input
              value={recipientInput}
              onChange={(event) => setRecipientInput(event.target.value)}
              className="w-full rounded-xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary-main"
              placeholder="guest@example.com, other@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reply body
            </span>
            <textarea
              value={plainText}
              onChange={(event) => setPlainText(event.target.value)}
              className="min-h-56 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-3 text-sm text-foreground outline-none transition focus:border-primary-main"
              placeholder="Write the reply that should be sent to the guest."
            />
          </label>

          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted-foreground">
              <ShieldAlert className="h-4 w-4 text-warning-main" />
              Save changes before sending. Regenerate will discard the current editor contents.
            </div>
          )}
        </div>

        <div className="border-t border-border-1 px-5 py-4">
          <Cluster gap={2} className="flex-wrap">
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={actionsDisabled || !hasUnsavedChanges}
              color="info"
              tone="solid"
              className="min-h-11 min-w-11"
            >
              <Save className="mr-2 h-4 w-4" />
              {savingDraft ? "Saving..." : "Save draft"}
            </Button>

            <Button
              type="button"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={actionsDisabled}
              color="warning"
              tone="outline"
              className="min-h-11 min-w-11"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {regeneratingDraft ? "Regenerating..." : "Regenerate"}
            </Button>

            <Button
              type="button"
              onClick={() => setShowSendConfirm(true)}
              disabled={actionsDisabled || parsedRecipients.length === 0 || !plainText.trim()}
              color="success"
              tone="solid"
              className="min-h-11 min-w-11"
            >
              <Send className="mr-2 h-4 w-4" />
              {sendingDraft ? "Sending..." : "Send"}
            </Button>

            <Button
              type="button"
              onClick={() => setShowResolveConfirm(true)}
              disabled={actionsDisabled}
              color="default"
              tone="outline"
              className="min-h-11 min-w-11"
            >
              {resolvingThread ? "Resolving..." : "Resolve"}
            </Button>
          </Cluster>
        </div>
      </section>

      <ConfirmModal
        isOpen={showRegenerateConfirm}
        title="Regenerate draft?"
        message={
          hasUnsavedChanges || currentDraft?.status === "edited"
            ? "This will overwrite the current reviewed draft with a fresh agent draft."
            : "Generate a fresh agent draft for this thread?"
        }
        confirmLabel="Regenerate"
        onCancel={() => setShowRegenerateConfirm(false)}
        onConfirm={handleConfirmRegenerate}
      />

      <ConfirmModal
        isOpen={showSendConfirm}
        title="Send this draft?"
        message={`Send to ${parsedRecipients.join(", ") || "the guest"} with subject "${subject}"?`}
        confirmLabel="Send now"
        onCancel={() => setShowSendConfirm(false)}
        onConfirm={handleConfirmSend}
      />

      <ConfirmModal
        isOpen={showResolveConfirm}
        title="Resolve thread?"
        message="Resolved threads are removed from the active inbox list."
        confirmLabel="Resolve"
        onCancel={() => setShowResolveConfirm(false)}
        onConfirm={handleConfirmResolve}
      />
    </>
  );
}
