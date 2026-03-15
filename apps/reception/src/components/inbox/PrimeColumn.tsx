"use client";

import { useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

import { Button } from "@acme/design-system/atoms";
import { Stack } from "@acme/design-system/primitives";

import { buildMcpAuthHeaders } from "@/services/mcpAuthHeaders";
import type { InboxThreadSummary } from "@/services/useInbox";

import ThreadList from "./ThreadList";

const MAX_BROADCAST_LENGTH = 500;

interface PrimeColumnProps {
  threads: InboxThreadSummary[];
  selectedThreadId: string | null;
  loading: boolean;
  error: string | null;
  onSelect: (threadId: string) => void | Promise<void>;
  onBroadcastSent?: () => void;
}

export default function PrimeColumn({
  threads,
  selectedThreadId,
  loading,
  error,
  onSelect,
  onBroadcastSent,
}: PrimeColumnProps) {
  const primeThreads = threads.filter((t) => t.channel !== "email");
  const showEmptyState = !loading && !error && primeThreads.length === 0;

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [composeSending, setComposeSending] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);

  function resetCompose() {
    setComposeText("");
    setComposeError(null);
    setConfirmPending(false);
  }

  function openCompose() {
    resetCompose();
    setComposeOpen(true);
  }

  function closeCompose() {
    setComposeOpen(false);
    resetCompose();
  }

  function handleSendClick() {
    if (!composeText.trim()) {
      return;
    }
    setConfirmPending(true);
  }

  async function handleConfirmedSend() {
    const text = composeText.trim();
    if (!text) {
      return;
    }

    setComposeSending(true);
    setComposeError(null);

    try {
      const headers = await buildMcpAuthHeaders();
      const response = await fetch("/api/mcp/inbox/prime-compose", {
        method: "POST",
        headers,
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        closeCompose();
        onBroadcastSent?.();
      } else {
        let errorMessage = "Failed to send — please try again."; // i18n-exempt -- INBOX-101 staff-facing UI [ttl=2026-12-31]
        try {
          const body = (await response.json()) as { error?: string };
          if (response.status === 503) {
            errorMessage = "Prime messaging is not available right now."; // i18n-exempt -- INBOX-101 staff-facing UI [ttl=2026-12-31]
          } else if (body.error) {
            console.error("[PrimeColumn] broadcast send error:", body.error);
          }
        } catch {
          // Keep default message
        }
        setConfirmPending(false);
        setComposeError(errorMessage);
      }
    } catch {
      setConfirmPending(false);
      setComposeError("Network error. Please check your connection and try again."); // i18n-exempt -- INBOX-101 staff-facing UI [ttl=2026-12-31]
    } finally {
      setComposeSending(false);
    }
  }

  return (
    <>
      <Stack gap={2}>
        {/* Column header */}
        <div className="flex items-center gap-2 px-1">
          <MessageSquare className="h-4 w-4 shrink-0 text-foreground/70" />
          <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Prime
          </span>
          {primeThreads.length > 0 && (
            <span className="ml-auto inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold tabular-nums text-primary-main">
              {primeThreads.length}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={openCompose}
            className="ml-auto flex items-center gap-1 text-xs"
            aria-label="New broadcast"
          >
            <Send className="h-3 w-3" />
            New broadcast
          </Button>
        </div>

        {/* Channel-specific empty state */}
        {showEmptyState ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 shadow-sm">
            <Stack gap={3} align="center" className="justify-center px-6 py-16 text-center">
              <div className="rounded-full bg-surface-3 p-3 text-muted-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">No Prime messages</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Prime campaign messages will appear here.
                </p>
              </div>
            </Stack>
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
      </Stack>

      {/* Compose broadcast modal */}
      {composeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Compose broadcast"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeCompose();
            }
          }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-surface-1 p-6 shadow-xl">
            {/* Modal header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">New broadcast message</h2>
              <button
                onClick={closeCompose}
                aria-label="Close"
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Text area */}
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              maxLength={MAX_BROADCAST_LENGTH}
              placeholder="Type your message to all current guests…"
              rows={5}
              className="w-full resize-none rounded-lg border border-border-1 bg-surface-2 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-main"
              disabled={composeSending}
            />

            {/* Character count */}
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {composeText.length}/{MAX_BROADCAST_LENGTH}
            </p>

            {/* Error message */}
            {composeError && (
              <p
                role="alert"
                className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {composeError}
              </p>
            )}

            {/* Actions */}
            {confirmPending ? (
              <div className="mt-4 space-y-3">
                <p className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-main">
                  {/* i18n-exempt -- INBOX-101 staff-facing UI [ttl=2026-12-31] */}
                  Send to all {primeThreads.length} current guest{primeThreads.length === 1 ? "" : "s"}? This cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmPending(false)}
                    disabled={composeSending}
                  >
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleConfirmedSend()}
                    disabled={composeSending}
                    aria-busy={composeSending}
                  >
                    {composeSending ? "Sending…" : "Confirm send"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={closeCompose}
                  disabled={composeSending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendClick}
                  disabled={!composeText.trim() || composeSending}
                >
                  Send
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
