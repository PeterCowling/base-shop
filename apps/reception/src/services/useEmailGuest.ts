import { useCallback, useState } from "react";

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

      try {
        const fetchedEmails = await fetchGuestEmails(bookingRef);
        const recipients = Object.values(fetchedEmails).filter(Boolean);

        if (recipients.length === 0) {
          const reason = "no-recipient-email";
          setMessage(formatDeferredMessage(reason));
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

        const response = await fetch("/api/mcp/guest-email-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await response.json()) as GuestEmailRouteResponse;

        if (!response.ok || !json.success) {
          throw new Error(json.error || "Failed to create guest email draft");
        }

        const status = json.status === "deferred" ? "deferred" : "drafted";
        if (status === "deferred") {
          setMessage(formatDeferredMessage(json.reason));
        } else {
          setMessage(json.draftId ?? json.messageId ?? "draft-created");
        }

        return {
          success: true,
          status,
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
        setMessage(err.message || "Failed to create guest email draft");
        return {
          success: false,
          status: "error",
          bookingRef,
          activityCode,
          recipients: [],
          error: err.message,
          dryRun,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, message, sendEmailGuest };
}

export default useEmailGuest;
