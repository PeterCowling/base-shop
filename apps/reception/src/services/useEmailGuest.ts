import { useCallback, useState } from "react";

import { buildMcpAuthHeaders } from "./mcpAuthHeaders";
import { fetchGuestEmails } from "./useBookingEmail";

export interface SendEmailGuestInput {
  bookingRef: string;
  activityCode: number;
  dryRun?: boolean;
}

export interface SendEmailGuestResult {
  success: boolean;
  status: "drafted" | "deferred" | "error";
  bookingRef: string;
  activityCode: number;
  recipients: string[];
  reason?: string;
  error?: string;
  subject?: string;
  dryRun?: boolean;
  preview?: {
    subject: string;
    bodyPlain: string;
  };
  draftId?: string;
  messageId?: string;
}

interface GuestEmailRouteResponse {
  success: boolean;
  status?: "drafted" | "deferred";
  reason?: string;
  subject?: string;
  dryRun?: boolean;
  preview?: {
    subject: string;
    bodyPlain: string;
  };
  draftId?: string;
  messageId?: string;
  error?: string;
}

function inferPrepaymentProvider(
  bookingRef: string
): "octorate" | "hostelworld" {
  return bookingRef.trim().startsWith("7763-") ? "hostelworld" : "octorate";
}

function formatDeferredMessage(reason?: string): string {
  return `Guest email deferred${reason ? `: ${reason}` : ""}`;
}

function getResultMessage(result: SendEmailGuestResult): string {
  if (result.status === "deferred") {
    return formatDeferredMessage(result.reason);
  }
  if (result.status === "error") {
    return result.error ?? "Failed to create guest email draft";
  }
  return result.draftId ?? result.messageId ?? "draft-created";
}

/**
 * Pure request helper that can be reused by both React hooks and background sync workers.
 */
export async function sendGuestEmailDraftRequest({
  bookingRef,
  activityCode,
  dryRun = false,
}: SendEmailGuestInput): Promise<SendEmailGuestResult> {
  try {
    const fetchedEmails = await fetchGuestEmails(bookingRef);
    const recipients = Object.values(fetchedEmails).filter(Boolean);

    if (recipients.length === 0) {
      const reason = "no-recipient-email";
      return {
        success: true,
        status: "deferred",
        bookingRef,
        activityCode,
        recipients,
        reason,
      };
    }

    const payload: Record<string, unknown> = {
      bookingRef,
      activityCode,
      recipients,
    };

    if (activityCode === 5) {
      payload.prepaymentProvider = inferPrepaymentProvider(bookingRef);
    }
    if (dryRun) {
      payload.dryRun = true;
    }
    const headers = await buildMcpAuthHeaders();

    const response = await fetch("/api/mcp/guest-email-activity", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const json = (await response.json()) as GuestEmailRouteResponse;

    if (!response.ok || !json.success) {
      throw new Error(json.error || "Failed to create guest email draft");
    }

    return {
      success: true,
      status: json.status === "deferred" ? "deferred" : "drafted",
      bookingRef,
      activityCode,
      recipients,
      reason: json.reason,
      subject: json.subject,
      dryRun: json.dryRun,
      preview: json.preview,
      draftId: json.draftId,
      messageId: json.messageId,
    };
  } catch (error) {
    const err = error as Error;
    console.error("Email Guest Connection Failed:", err);
    return {
      success: false,
      status: "error",
      bookingRef,
      activityCode,
      recipients: [],
      error: err.message,
      dryRun,
    };
  }
}

/**
 * useEmailGuest
 * Creates draft guest emails through the in-repo MCP route using
 * reservation activity context.
 */
function useEmailGuest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendEmailGuest = useCallback(
    async ({
      bookingRef,
      activityCode,
      dryRun = false,
    }: SendEmailGuestInput): Promise<SendEmailGuestResult> => {
      setLoading(true);
      const result = await sendGuestEmailDraftRequest({
        bookingRef,
        activityCode,
        dryRun,
      });
      setMessage(getResultMessage(result));
      setLoading(false);
      return result;
    },
    []
  );

  return { loading, message, sendEmailGuest };
}

export default useEmailGuest;
