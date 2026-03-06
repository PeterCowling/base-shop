import type { InboxMessage, InboxThreadSummary } from "@/services/useInbox";

export type InboxBadge = {
  label: string;
  className: string;
};

export function formatInboxTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function buildInboxThreadBadge(thread: InboxThreadSummary): InboxBadge {
  if (thread.needsManualDraft) {
    return {
      label: "Needs manual draft",
      className: "bg-warning-light text-warning-main",
    };
  }

  if (thread.currentDraft?.status === "edited") {
    return {
      label: "Staff edited draft",
      className: "bg-info-light text-info-main",
    };
  }

  if (thread.currentDraft?.status === "generated") {
    return {
      label: "Agent draft ready",
      className: "bg-success-light text-success-main",
    };
  }

  if (thread.status === "sent") {
    return {
      label: "Sent",
      className: "bg-primary-soft text-primary-main",
    };
  }

  if (thread.status === "review_later") {
    return {
      label: "Review later",
      className: "bg-surface-3 text-muted-foreground",
    };
  }

  return {
    label: "Pending",
    className: "bg-surface-3 text-foreground",
  };
}

export function buildDraftQualityBadge(
  quality: Record<string, unknown> | null | undefined,
): InboxBadge | null {
  if (!quality) {
    return null;
  }

  return quality.passed === true
    ? {
        label: "Quality passed",
        className: "bg-success-light text-success-main",
      }
    : {
        label: "Check before send",
        className: "bg-warning-light text-warning-main",
      };
}

export function inferReplySubject(subject: string | null | undefined): string {
  const trimmed = subject?.trim();
  if (!trimmed) {
    return "Re: Guest inquiry";
  }

  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export function findLatestInboundSender(messages: InboxMessage[]): string | null {
  const latestInbound = [...messages]
    .reverse()
    .find((message) => message.direction === "inbound" && message.senderEmail);

  return latestInbound?.senderEmail ?? null;
}
