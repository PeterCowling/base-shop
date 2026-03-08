import type { InboxMessage, InboxThreadSummary } from "@/services/useInbox";

export type InboxBadge = {
  label: string;
  className: string;
  /** Tailwind border-color class for left-edge status indicator on thread rows. */
  edgeColor: string;
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
      edgeColor: "border-l-warning-main",
    };
  }

  if (thread.currentDraft?.status === "edited" || thread.currentDraft?.status === "under_review") {
    return {
      label: "Edited",
      className: "bg-info-light text-info-main",
      edgeColor: "border-l-info-main",
    };
  }

  if (thread.currentDraft?.status === "generated" || thread.currentDraft?.status === "suggested") {
    return {
      label: "Draft ready",
      className: "bg-success-light text-success-main",
      edgeColor: "border-l-success-main",
    };
  }

  if (thread.status === "sent") {
    return {
      label: "Sent",
      className: "bg-primary-soft text-primary-main",
      edgeColor: "border-l-primary-main",
    };
  }

  if (thread.status === "review_later") {
    return {
      label: "Review",
      className: "bg-surface-3 text-muted-foreground",
      edgeColor: "border-l-surface-3",
    };
  }

  return {
    label: "Pending",
    className: "bg-surface-3 text-foreground",
    edgeColor: "border-l-surface-3",
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
        edgeColor: "border-l-success-main",
      }
    : {
        label: "Check before send",
        className: "bg-warning-light text-warning-main",
        edgeColor: "border-l-warning-main",
      };
}

export function inferReplySubject(subject: string | null | undefined): string {
  const trimmed = subject?.trim();
  if (!trimmed) {
    return "Re: Guest inquiry";
  }

  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

/**
 * Strip quoted reply content from a plain-text email body so each message
 * in the conversation view shows only its own content.
 *
 * Handles Gmail (EN/IT/DE/FR/ES), Apple Mail, Outlook, and generic `>` quoting.
 * Also handles single-line bodies where Gmail has stripped all newlines — the
 * quoted block is detected inline via ` > Il giorno` / ` > On` patterns.
 */
export function stripQuotedContent(body: string): string {
  // Inline quote detection for single-line bodies (Gmail sometimes strips newlines).
  // Try signature separator first ("-- " or "-- Regards"), then quote delimiters.
  const inlineSigIdx = body.search(/ -- (?:Regards|Cordiali saluti|Mit freundlichen|Cordialement)/);
  if (inlineSigIdx !== -1) {
    return body.slice(0, inlineSigIdx).trimEnd();
  }

  // Match quote delimiters with or without "> " prefix, embedded in a single line.
  const inlineQuoteIdx = body.search(
    / (?:> )?(?:Il giorno .{10,80} ha scritto:|On .{6,80} wrote:|Am .{10,80} schrieb |Le .{10,80} a \u00e9crit|El .{10,80} escribi\u00f3)/,
  );
  if (inlineQuoteIdx !== -1) {
    return body.slice(0, inlineQuoteIdx).trimEnd();
  }

  const lines = body.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Gmail / generic "On <date>, <name> wrote:" delimiter (EN)
    if (/^On .{10,80} wrote:\s*$/.test(line)) break;

    // Italian: "Il giorno ... ha scritto:"
    if (/^>?\s*Il giorno .{10,80} ha scritto:\s*$/.test(line)) break;

    // German: "Am ... schrieb ...:"
    if (/^Am .{10,80} schrieb .{1,80}:\s*$/.test(line)) break;

    // French: "Le ... a écrit :"
    if (/^Le .{10,80} a \u00e9crit\s*:\s*$/.test(line)) break;

    // Spanish: "El ... escribió:"
    if (/^El .{10,80} escribi\u00f3\s*:\s*$/.test(line)) break;

    // Apple Mail / iOS: "Inviato da iPhone/iPad" or "Sent from my iPhone"
    if (/^(?:Inviato da|Sent from my) /i.test(line)) break;

    // Outlook-style separator
    if (/^-{2,}\s*(?:Original Message|Forwarded message|Messaggio originale)/i.test(line)) break;

    // Block of ">" quoted lines — break at the first `>` line in a
    // contiguous run (whether preceded by a blank line or not)
    if (line.startsWith("> ") || line === ">") break;

    result.push(line);
  }

  return result.join("\n").trimEnd();
}

export function findLatestInboundSender(messages: InboxMessage[]): string | null {
  const latestInbound = [...messages]
    .reverse()
    .find((message) => message.direction === "inbound" && message.senderEmail);

  return latestInbound?.senderEmail ?? null;
}
