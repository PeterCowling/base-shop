"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, RefreshCw, Save, Send, ShieldAlert, XCircle } from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Grid, Inline } from "@acme/design-system/primitives";

import ConfirmModal from "@/components/common/ConfirmModal";
import type { InboxThreadDetail } from "@/services/useInbox";

import {
  buildDraftQualityBadge,
  findLatestInboundSender,
  inferReplySubject,
} from "./presentation";
import TemplatePicker from "./TemplatePicker";

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
    templateUsed?: string;
  }) => Promise<void>;
  onRegenerate: (force?: boolean) => Promise<void>;
  onSend: () => Promise<void>;
  onResolve: () => Promise<void>;
  onDismiss: () => Promise<{ thread: InboxThreadDetail["thread"]; gmailMarkedRead: boolean }>;
}

type DraftConfirmDialog = "none" | "regenerate" | "send" | "resolve" | "dismiss";

function buildRegenerateConfirmMessage(hasUnsavedChanges: boolean, status: string | undefined): string {
  return hasUnsavedChanges || status === "edited" || status === "under_review"
    ? "This will overwrite the current draft with a fresh agent-generated reply."
    : "Generate a fresh agent draft for this thread?";
}

function parseRecipientEmails(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isValidEmail(value: string): boolean {
  // Requires: no consecutive dots, 2+ char domain extension, reasonable structure.
  // eslint-disable-next-line security/detect-unsafe-regex -- IDEA-DISPATCH-20260312140000-0005 bounded input: short user-typed email strings
  return /^[a-zA-Z0-9](?:[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(value)
    && !value.includes("..");
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
  const channelCapabilities = threadDetail.thread.capabilities;
  const qualityBadge = buildDraftQualityBadge(currentDraft?.quality);
  const suggestedRecipient = findLatestInboundSender(threadDetail.messages);
  const canSaveDraft = channelCapabilities.supportsDraftSave;
  const canRegenerateDraft = channelCapabilities.supportsDraftRegenerate;
  const canSendDraft = channelCapabilities.supportsDraftSend;
  const canMutateDraft = channelCapabilities.supportsDraftMutations;
  const canMutateThread = channelCapabilities.supportsThreadMutations;
  const showActionBar = canMutateDraft || canMutateThread;

  const [subject, setSubject] = useState("");
  const [recipientInput, setRecipientInput] = useState("");
  const [plainText, setPlainText] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [recipientBlurError, setRecipientBlurError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<DraftConfirmDialog>("none");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Determine whether this is a Prime thread (show template picker)
  const isPrimeThread = threadDetail.thread.channel === "prime_direct"
    || threadDetail.thread.channel === "prime_broadcast";

  // Extract the latest inbound message text for template auto-suggest
  const latestInboundText = useMemo(() => {
    if (!isPrimeThread) return null;
    const inbound = [...threadDetail.messages]
      .reverse()
      .find((m) => m.direction === "inbound");
    return inbound?.bodyPlain ?? inbound?.snippet ?? null;
  }, [isPrimeThread, threadDetail.messages]);

  // Template selection handler
  const handleTemplateSelect = useCallback(
    (formattedText: string, templateId: string) => {
      setPlainText(formattedText);
      setSelectedTemplateId(templateId);
    },
    [],
  );

  useEffect(() => {
    setSubject(
      channelCapabilities.supportsSubject
        ? inferReplySubject(currentDraft?.subject ?? threadDetail.thread.subject)
        : (currentDraft?.subject ?? ""),
    );
    setRecipientInput(
      channelCapabilities.supportsRecipients
        ? (currentDraft?.recipientEmails.join(", ")
          ?? suggestedRecipient
          ?? "")
        : "",
    );
    setPlainText(currentDraft?.plainText ?? "");
    setValidationError(null);
    setRecipientBlurError(null);
    setSelectedTemplateId(currentDraft?.templateUsed ?? null);
  }, [
    channelCapabilities.supportsRecipients,
    channelCapabilities.supportsSubject,
    currentDraft,
    suggestedRecipient,
    threadDetail.thread.id,
    threadDetail.thread.subject,
  ]);

  const parsedRecipients = useMemo(
    () => parseRecipientEmails(recipientInput),
    [recipientInput],
  );

  const hasUnsavedChanges = useMemo(() => {
    const baselineSubject = channelCapabilities.supportsSubject
      ? inferReplySubject(currentDraft?.subject ?? threadDetail.thread.subject)
      : (currentDraft?.subject ?? "");
    const baselineRecipients = channelCapabilities.supportsRecipients
      ? (currentDraft?.recipientEmails.join(", ") ?? suggestedRecipient ?? "")
      : "";
    const baselinePlainText = currentDraft?.plainText ?? "";

    return (
      (channelCapabilities.supportsSubject && subject !== baselineSubject)
      || (channelCapabilities.supportsRecipients && recipientInput !== baselineRecipients)
      || plainText !== baselinePlainText
    );
  }, [
    channelCapabilities.supportsRecipients,
    channelCapabilities.supportsSubject,
    currentDraft?.plainText,
    currentDraft?.recipientEmails,
    currentDraft?.subject,
    plainText,
    recipientInput,
    subject,
    suggestedRecipient,
    threadDetail.thread.subject,
  ]);

  function handleRecipientBlur() {
    const trimmed = recipientInput.trim();
    if (!trimmed) {
      setRecipientBlurError(null);
      return;
    }
    const emails = parseRecipientEmails(trimmed);
    const invalid = emails.filter((e) => !isValidEmail(e));
    if (invalid.length > 0) {
      setRecipientBlurError(
        invalid.length === 1
          ? `"${invalid[0]}" is not a valid email address.`
          : `Invalid email addresses: ${invalid.map((e) => `"${e}"`).join(", ")}`,
      );
    } else {
      setRecipientBlurError(null);
    }
  }

  const requiresManualDraft = threadDetail.thread.needsManualDraft && !currentDraft;
  const actionsDisabled = savingDraft || regeneratingDraft || sendingDraft || resolvingThread || dismissingThread;

  const hasNoReplyRecipient = useMemo(() => {
    if (!channelCapabilities.supportsRecipients) return false;
    return parsedRecipients.some((email) => /^no[-.]?reply@/i.test(email) || /\bnoreply\b/i.test(email));
  }, [channelCapabilities.supportsRecipients, parsedRecipients]);

  async function handleSave() {
    if (!canSaveDraft) {
      throw new Error("Draft actions are not available for this channel yet.");
    }
    if (channelCapabilities.supportsSubject && !subject.trim()) {
      setValidationError("Subject is required.");
      throw new Error("Subject is required.");
    }
    if (channelCapabilities.supportsRecipients && parsedRecipients.length === 0) {
      setValidationError("At least one recipient email is required.");
      throw new Error("At least one recipient email is required.");
    }
    if (channelCapabilities.supportsRecipients && parsedRecipients.some((value) => !isValidEmail(value))) {
      setValidationError("Recipients must be valid email addresses.");
      throw new Error("Recipients must be valid email addresses.");
    }
    if (!plainText.trim()) {
      setValidationError("Draft body cannot be empty.");
      throw new Error("Draft body cannot be empty.");
    }

    setValidationError(null);
    await onSave({
      subject: channelCapabilities.supportsSubject ? subject : undefined,
      recipientEmails: channelCapabilities.supportsRecipients ? parsedRecipients : undefined,
      plainText,
      html: null,
      templateUsed: selectedTemplateId ?? undefined,
    });
  }

  async function handleConfirmSend() {
    try {
      if (hasUnsavedChanges) {
        await handleSave();
      }
      await onSend();
      setConfirmDialog("none");
    } catch {
      // Keep the confirmation modal open so staff can correct the draft.
    }
  }

  async function handleConfirmRegenerate() {
    try {
      await onRegenerate(currentDraft?.status === "edited");
      setConfirmDialog("none");
    } catch {
      // Keep the confirmation modal open so staff can retry or cancel.
    }
  }

  async function handleConfirmResolve() {
    try {
      await onResolve();
      setConfirmDialog("none");
    } catch {
      // Keep the confirmation modal open so staff can retry or cancel.
    }
  }

  async function handleConfirmDismiss() {
    try {
      await onDismiss();
      setConfirmDialog("none");
    } catch {
      // Keep the confirmation modal open so staff can retry or cancel.
    }
  }

  return (
    <>
      <section className="rounded-2xl border border-border-1 bg-surface-2 shadow-sm">
        {/* Header with badges */}
        <Inline gap={3} className="justify-between px-5 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {channelCapabilities.bodyLabel}
          </h3>
          <Inline gap={2}>
            {currentDraft?.templateUsed && (
              <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-foreground/60">
                {currentDraft.templateUsed}
              </span>
            )}
            {currentDraft?.quality?.deliveryStatus === "needs_follow_up" && (
              <span className="rounded-full bg-warning-light px-2 py-0.5 text-xs font-medium text-warning-main">
                Needs follow-up
              </span>
            )}
            {qualityBadge && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${qualityBadge.className}`}>
                {qualityBadge.label}
              </span>
            )}
          </Inline>
        </Inline>

        <div className="space-y-3 px-5 pb-4">
          {requiresManualDraft && (
            <div className="rounded-xl border border-warning-main/20 bg-warning-light px-3 py-2.5 text-sm text-warning-main">
              {threadDetail.thread.draftFailureMessage
                ? `Auto-draft failed: ${threadDetail.thread.draftFailureMessage} Write a manual reply below.`
                : "Auto-draft unavailable for this thread. Write a manual reply below."}
            </div>
          )}

          {channelCapabilities.readOnlyNotice && (
            <div className="rounded-xl border border-info-main/20 bg-info-light px-3 py-2.5 text-sm text-info-main">
              {channelCapabilities.readOnlyNotice}
            </div>
          )}

          {validationError && (
            <div className="rounded-xl border border-error-main/20 bg-error-light px-3 py-2.5 text-sm text-error-main">
              {validationError}
            </div>
          )}

          {isPrimeThread && (
            <TemplatePicker
              latestInboundText={latestInboundText}
              onSelect={handleTemplateSelect}
              activeTemplateId={selectedTemplateId}
            />
          )}

          {(channelCapabilities.supportsSubject || channelCapabilities.supportsRecipients) && (
            <Grid gap={3} className="sm:grid-cols-2">
              {channelCapabilities.supportsSubject && (
                <div>
                  <label htmlFor="draft-subject" className="mb-1 block text-xs font-semibold text-foreground/70">
                    {channelCapabilities.subjectLabel}
                  </label>
                  <input
                    id="draft-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    disabled={!canSaveDraft}
                    className="w-full rounded-lg border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary-main focus:ring-1 focus:ring-primary-main/30"
                    placeholder="Re: Guest inquiry"
                  />
                </div>
              )}
              {channelCapabilities.supportsRecipients && (
                <div>
                  <label htmlFor="draft-recipient" className="mb-1 block text-xs font-semibold text-foreground/70">
                    {channelCapabilities.recipientLabel}
                  </label>
                  <input
                    id="draft-recipient"
                    value={recipientInput}
                    onChange={(event) => {
                      setRecipientInput(event.target.value);
                      setRecipientBlurError(null);
                    }}
                    onBlur={handleRecipientBlur}
                    disabled={!canSaveDraft}
                    className={`w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary-main focus:ring-1 focus:ring-primary-main/30 ${
                      recipientBlurError
                        ? "border-error-main"
                        : "border-border-1"
                    }`}
                    placeholder="guest@example.com"
                  />
                  {recipientBlurError && (
                    <p className="mt-1 text-xs text-error-main">{recipientBlurError}</p>
                  )}
                  {hasNoReplyRecipient && !recipientBlurError && (
                    <p className="mt-1 text-xs text-warning-main">
                      This address looks like a no-reply address — sending here will not reach anyone.
                    </p>
                  )}
                </div>
              )}
            </Grid>
          )}

          {/* Message body */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground/70">
              {channelCapabilities.bodyLabel}
            </label>
            <textarea
              value={plainText}
              onChange={(event) => setPlainText(event.target.value)}
              rows={6}
              disabled={!canSaveDraft}
              className="w-full rounded-xl border border-border-1 bg-surface-2 px-3 py-3 text-sm leading-relaxed text-foreground outline-none transition focus:border-primary-main focus:ring-1 focus:ring-primary-main/30"
              placeholder={channelCapabilities.bodyPlaceholder}
            />
          </div>

          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 rounded-lg bg-warning-light/50 px-3 py-1.5 text-xs text-warning-main">
              <ShieldAlert className="h-3.5 w-3.5" />
              Unsaved changes
            </div>
          )}
        </div>

        {/* Action bar — clear visual hierarchy */}
        {showActionBar && (
          <Inline gap={2} className="border-t border-border-1 px-5 py-3">
            {canSaveDraft && (
              <>
                <Button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={actionsDisabled || !hasUnsavedChanges}
                  color="info"
                  tone="outline"
                  className="min-h-9 rounded-lg text-xs"
                >
                  <Save className="mr-1 h-3.5 w-3.5" />
                  {savingDraft ? "Saving..." : "Save"}
                </Button>

                {canRegenerateDraft && (
                  <Button
                    type="button"
                    onClick={() => setConfirmDialog("regenerate")}
                    disabled={actionsDisabled}
                    color="accent"
                    tone="outline"
                    className="min-h-9 rounded-lg text-xs"
                  >
                    <RefreshCw className={`mr-1 h-3.5 w-3.5 ${regeneratingDraft ? "animate-spin" : ""}`} />
                    {regeneratingDraft ? "..." : "Regenerate"}
                  </Button>
                )}
              </>
            )}

            {canMutateThread && (
              <>
                <Button
                  type="button"
                  onClick={() => setConfirmDialog("resolve")}
                  disabled={actionsDisabled}
                  color="success"
                  tone="outline"
                  className="min-h-9 rounded-lg text-xs"
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  {resolvingThread ? "..." : "Resolve"}
                </Button>

                <Button
                  type="button"
                  onClick={() => setConfirmDialog("dismiss")}
                  disabled={actionsDisabled}
                  color="danger"
                  tone="outline"
                  className="min-h-9 rounded-lg text-xs"
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  {dismissingThread ? "..." : "Dismiss"}
                </Button>
              </>
            )}

            {canSendDraft && (
              <Button
                type="button"
                onClick={() => setConfirmDialog("send")}
                disabled={
                  actionsDisabled
                  || (channelCapabilities.supportsRecipients && parsedRecipients.length === 0)
                  || !plainText.trim()
                }
                color="success"
                tone="solid"
                className="ml-auto min-h-9 rounded-lg px-6 text-sm font-semibold"
              >
                <Send className="mr-1.5 h-4 w-4" />
                {sendingDraft ? "Sending..." : channelCapabilities.sendLabel}
              </Button>
            )}
          </Inline>
        )}
      </section>

      {(canRegenerateDraft || canSendDraft) && (
        <>
          {canRegenerateDraft && (
            <ConfirmModal
              isOpen={confirmDialog === "regenerate"}
              title="Regenerate draft?"
              message={buildRegenerateConfirmMessage(hasUnsavedChanges, currentDraft?.status)}
              confirmLabel="Regenerate"
              onCancel={() => setConfirmDialog("none")}
              onConfirm={handleConfirmRegenerate}
            />
          )}

          {canSendDraft && (
            <ConfirmModal
              isOpen={confirmDialog === "send"}
              title={channelCapabilities.supportsSubject ? "Send this reply?" : "Send this message?"}
              message={
                channelCapabilities.supportsRecipients
                  ? `Send to ${parsedRecipients.join(", ") || "the guest"}${subject.trim() ? ` with subject "${subject}"` : ""}?`
                  : `Send via ${threadDetail.thread.channelLabel.toLowerCase()} for this ${threadDetail.thread.lane} thread?`
              }
              confirmLabel="Send now"
              onCancel={() => setConfirmDialog("none")}
              onConfirm={handleConfirmSend}
            />
          )}
        </>
      )}

      {canMutateThread && (
        <>
          <ConfirmModal
            isOpen={confirmDialog === "resolve"}
            title="Resolve thread?"
            message="This thread will be removed from your active inbox."
            confirmLabel="Resolve"
            onCancel={() => setConfirmDialog("none")}
            onConfirm={handleConfirmResolve}
          />

          <ConfirmModal
            isOpen={confirmDialog === "dismiss"}
            title="Mark as not relevant?"
            message="This thread will be archived. The sender details are recorded so similar emails can be reviewed later."
            confirmLabel="Not relevant"
            onCancel={() => setConfirmDialog("none")}
            onConfirm={handleConfirmDismiss}
          />
        </>
      )}
    </>
  );
}
