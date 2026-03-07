import type { InboxMessage, InboxThreadSummary } from "@/services/useInbox";

export type InboxBadge = {
  label: string;
  className: string;
};

export function formatInboxTimestamp(value: string | null | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffHr < 48) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function buildInboxThreadBadge(thread: InboxThreadSummary): InboxBadge {
  if (thread.needsManualDraft) {
    return {
      label: "Manual",
      className: "bg-warning-light text-warning-main",
    };
  }

  if (thread.currentDraft?.status === "edited") {
    return {
      label: "Edited",
      className: "bg-info-light text-info-main",
    };
  }

  if (thread.currentDraft?.status === "generated") {
    return {
      label: "Draft ready",
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
      label: "Review",
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
