import "server-only";

import type { ParsedGmailThread } from "../gmail-client";

import { resolveInboxChannelAdapter } from "./channel-adapters.server";
import type {
  InboxChannel,
  InboxChannelCapabilities,
  InboxReviewMode,
} from "./channels";
import type {
  InboxDraftRow,
  InboxMessageRow,
  InboxThreadRecord,
  InboxThreadRow,
} from "./repositories.server";

/**
 * Canonical metadata type for inbox threads.
 * Replaces the former `InboxThreadMetadata`, `SyncThreadMetadata`, and recovery `ThreadMetadata`.
 * Fields map 1:1 to promoted columns on the `threads` table (0006 migration),
 * except `channel` (read-side computed), `gmailHistoryId`, and `lastSyncMode` (sync-internal, metadata_json only).
 */
export type ThreadMetadata = {
  // Promoted to columns
  latestInboundMessageId?: string | null;
  latestInboundAt?: string | null;
  latestInboundSender?: string | null;
  latestAdmissionDecision?: string | null;
  latestAdmissionReason?: string | null;
  needsManualDraft?: boolean;
  draftFailureCode?: string | null;
  draftFailureMessage?: string | null;
  /** Structured list of which quality checks failed, for analytics aggregation. */
  draftFailureChecks?: string[] | null;
  lastProcessedAt?: string | null;
  lastDraftId?: string | null;
  lastDraftTemplateSubject?: string | null;
  lastDraftQualityPassed?: boolean;
  guestBookingRef?: string | null;
  guestOccupantId?: string | null;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  guestCheckIn?: string | null;
  guestCheckOut?: string | null;
  guestRoomNumbers?: string[] | null;
  recoveryAttempts?: number | null;
  // Retained in metadata_json only
  gmailHistoryId?: string | null;
  lastSyncMode?: string | null;
  // Read-side computed (not stored)
  channel?: InboxChannel | null;
};

/** @deprecated Use `ThreadMetadata` instead. Alias kept for migration period. */
export type InboxThreadMetadata = ThreadMetadata;

export type InboxMessagePayload = {
  labelIds?: string[];
  historyId?: string | null;
  from?: string | null;
  to?: string[];
  inReplyTo?: string | null;
  references?: string | null;
  body?: {
    plain?: string;
    html?: string;
  };
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
};

export type InboxDraftApiModel = {
  id: string;
  threadId: string;
  gmailDraftId: string | null;
  status: string;
  subject: string | null;
  recipientEmails: string[];
  plainText: string;
  html: string | null;
  originalPlainText: string | null;
  originalHtml: string | null;
  templateUsed: string | null;
  quality: Record<string, unknown> | null;
  interpret: Record<string, unknown> | null;
  createdByUid: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InboxMessageApiModel = {
  id: string;
  threadId: string;
  direction: string;
  senderEmail: string | null;
  recipientEmails: string[];
  subject: string | null;
  snippet: string | null;
  sentAt: string | null;
  bodyPlain: string | null;
  bodyHtml: string | null;
  inReplyTo: string | null;
  references: string | null;
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
  // Prime-specific rich fields (absent/undefined for email messages)
  links?: unknown[] | null;
  primeAttachments?: unknown[] | null;
  cards?: unknown[] | null;
  audience?: string | null;
  campaignId?: string | null;
};

export type InboxThreadSummaryApiModel = {
  id: string;
  /**
   * Discriminator for the thread data source.
   * - "email": thread is stored in D1 and was fetched via Gmail sync.
   * - "prime": thread is fetched live from the Prime review API.
   * Defaults to "email" for threads created before this field was added.
   */
  source?: "email" | "prime";
  status: string;
  channel: InboxChannel;
  channelLabel: string;
  lane: "support" | "promotion";
  reviewMode: InboxReviewMode;
  capabilities: InboxChannelCapabilities;
  subject: string | null;
  snippet: string | null;
  latestMessageAt: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
  needsManualDraft: boolean;
  draftFailureCode: string | null;
  draftFailureMessage: string | null;
  latestAdmissionDecision: string | null;
  latestAdmissionReason: string | null;
  currentDraft: InboxDraftApiModel | null;
  guestBookingRef: string | null;
  guestFirstName: string | null;
  guestLastName: string | null;
};

function parseJsonObject(raw: string | null | undefined): Record<string, unknown> | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function parseThreadMetadata(raw: string | null | undefined): ThreadMetadata {
  const parsed = parseJsonObject(raw);
  return parsed ? (parsed as ThreadMetadata) : {};
}

function parseJsonStringArray(raw: string | null | undefined): string[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : null;
  } catch {
    return null;
  }
}

/**
 * Read thread metadata from promoted columns with metadata_json fallback.
 * Column values take precedence; metadata_json fills gaps for rows written before the migration.
 */
export function parseThreadMetadataFromRow(row: InboxThreadRow): ThreadMetadata {
  const fallback = parseThreadMetadata(row.metadata_json);

  return {
    latestInboundMessageId: row.latest_inbound_message_id ?? fallback.latestInboundMessageId ?? null,
    latestInboundAt: row.latest_inbound_at ?? fallback.latestInboundAt ?? null,
    latestInboundSender: row.latest_inbound_sender ?? fallback.latestInboundSender ?? null,
    latestAdmissionDecision: row.latest_admission_decision ?? fallback.latestAdmissionDecision ?? null,
    latestAdmissionReason: row.latest_admission_reason ?? fallback.latestAdmissionReason ?? null,
    needsManualDraft: row.needs_manual_draft != null ? Boolean(row.needs_manual_draft) : fallback.needsManualDraft,
    draftFailureCode: row.draft_failure_code ?? fallback.draftFailureCode ?? null,
    draftFailureMessage: row.draft_failure_message ?? fallback.draftFailureMessage ?? null,
    lastProcessedAt: row.last_processed_at ?? fallback.lastProcessedAt ?? null,
    lastDraftId: row.last_draft_id ?? fallback.lastDraftId ?? null,
    lastDraftTemplateSubject: row.last_draft_template_subject ?? fallback.lastDraftTemplateSubject ?? null,
    lastDraftQualityPassed: row.last_draft_quality_passed != null ? Boolean(row.last_draft_quality_passed) : fallback.lastDraftQualityPassed,
    guestBookingRef: row.guest_booking_ref ?? fallback.guestBookingRef ?? null,
    guestOccupantId: row.guest_occupant_id ?? fallback.guestOccupantId ?? null,
    guestFirstName: row.guest_first_name ?? fallback.guestFirstName ?? null,
    guestLastName: row.guest_last_name ?? fallback.guestLastName ?? null,
    guestCheckIn: row.guest_check_in ?? fallback.guestCheckIn ?? null,
    guestCheckOut: row.guest_check_out ?? fallback.guestCheckOut ?? null,
    guestRoomNumbers: parseJsonStringArray(row.guest_room_numbers_json) ?? fallback.guestRoomNumbers ?? null,
    recoveryAttempts: row.recovery_attempts ?? fallback.recoveryAttempts ?? null,
    // Retained in metadata_json only
    gmailHistoryId: fallback.gmailHistoryId ?? null,
    lastSyncMode: fallback.lastSyncMode ?? null,
    // Read-side computed (not from column or metadata_json)
    channel: fallback.channel ?? null,
  };
}

export function parseMessagePayload(raw: string | null | undefined): InboxMessagePayload {
  const parsed = parseJsonObject(raw);
  return parsed ? (parsed as InboxMessagePayload) : {};
}

export function serializeDraft(draft: InboxDraftRow): InboxDraftApiModel {
  return {
    id: draft.id,
    threadId: draft.thread_id,
    gmailDraftId: draft.gmail_draft_id,
    status: draft.status,
    subject: draft.subject,
    recipientEmails: parseJsonArray(draft.recipient_emails_json),
    plainText: draft.plain_text,
    html: draft.html,
    originalPlainText: draft.original_plain_text,
    originalHtml: draft.original_html,
    templateUsed: draft.template_used,
    quality: parseJsonObject(draft.quality_json),
    interpret: parseJsonObject(draft.interpret_json),
    createdByUid: draft.created_by_uid,
    createdAt: draft.created_at,
    updatedAt: draft.updated_at,
  };
}

export function getCurrentDraft(record: InboxThreadRecord): InboxDraftRow | null {
  return record.drafts[0] ?? null;
}

export function getPendingDraft(record: InboxThreadRecord): InboxDraftRow | null {
  return record.drafts.find((draft) => draft.status === "generated") ?? null;
}

export function serializeMessage(message: InboxMessageRow): InboxMessageApiModel {
  const payload = parseMessagePayload(message.payload_json);
  return {
    id: message.id,
    threadId: message.thread_id,
    direction: message.direction,
    senderEmail: message.sender_email,
    recipientEmails: parseJsonArray(message.recipient_emails_json),
    subject: message.subject,
    snippet: message.snippet,
    sentAt: message.sent_at,
    bodyPlain: payload.body?.plain ?? null,
    bodyHtml: payload.body?.html ?? null,
    inReplyTo: payload.inReplyTo ?? null,
    references: payload.references ?? null,
    attachments: payload.attachments ?? [],
  };
}

export function mergeMessagesWithGmailThread(
  storedMessages: InboxMessageRow[],
  gmailThread: ParsedGmailThread | null,
): InboxMessageApiModel[] {
  const gmailMessagesById = new Map(
    (gmailThread?.messages ?? []).map((message) => [message.id, message]),
  );

  return storedMessages.map((message) => {
    const serialized = serializeMessage(message);
    const hydrated = gmailMessagesById.get(message.id);

    if (!hydrated) {
      return serialized;
    }

    return {
      ...serialized,
      senderEmail: hydrated.from ?? serialized.senderEmail,
      recipientEmails: hydrated.to.length > 0 ? hydrated.to : serialized.recipientEmails,
      subject: hydrated.subject ?? serialized.subject,
      snippet: hydrated.snippet || serialized.snippet,
      sentAt: hydrated.receivedAt ?? serialized.sentAt,
      bodyPlain: hydrated.body.plain || serialized.bodyPlain,
      bodyHtml: hydrated.body.html ?? serialized.bodyHtml,
      inReplyTo: hydrated.inReplyTo ?? serialized.inReplyTo,
      references: hydrated.references ?? serialized.references,
      attachments: hydrated.attachments.length > 0 ? hydrated.attachments : serialized.attachments,
    };
  });
}

export function getLatestInboundStoredMessage(record: InboxThreadRecord): InboxMessageRow | null {
  const inbound = record.messages.filter((message) => message.direction === "inbound");
  return inbound.at(-1) ?? null;
}

export function buildThreadSummary(record: InboxThreadRecord): InboxThreadSummaryApiModel {
  const metadata = parseThreadMetadataFromRow(record.thread);
  const currentDraft = getCurrentDraft(record);
  const channelAdapter = resolveInboxChannelAdapter(metadata.channel);

  return {
    id: record.thread.id,
    source: "email",
    status: record.thread.status,
    channel: channelAdapter.channel,
    channelLabel: channelAdapter.channelLabel,
    lane: channelAdapter.lane,
    reviewMode: channelAdapter.reviewMode,
    capabilities: { ...channelAdapter.capabilities },
    subject: record.thread.subject,
    snippet: record.thread.snippet,
    latestMessageAt: record.thread.latest_message_at,
    lastSyncedAt: record.thread.last_synced_at,
    updatedAt: record.thread.updated_at,
    needsManualDraft: Boolean(metadata.needsManualDraft),
    draftFailureCode: metadata.draftFailureCode ?? null,
    draftFailureMessage: metadata.draftFailureMessage ?? null,
    latestAdmissionDecision: metadata.latestAdmissionDecision ?? null,
    latestAdmissionReason: metadata.latestAdmissionReason ?? null,
    currentDraft: currentDraft ? serializeDraft(currentDraft) : null,
    guestBookingRef: metadata.guestBookingRef ?? null,
    guestFirstName: metadata.guestFirstName ?? null,
    guestLastName: metadata.guestLastName ?? null,
  };
}

export function isThreadVisibleInInbox(thread: InboxThreadRow): boolean {
  if (
    thread.status === "auto_archived"
    || thread.status === "resolved"
    || thread.status === "sent"
  ) {
    return false;
  }

  return thread.latest_message_direction !== "outbound";
}

export function buildThreadSummaryFromRow(
  row: import("./repositories.server").ThreadWithLatestDraftRow,
): InboxThreadSummaryApiModel {
  const metadata = parseThreadMetadataFromRow(row);
  const channelAdapter = resolveInboxChannelAdapter(metadata.channel);

  let currentDraft: InboxDraftApiModel | null = null;
  if (row.draft_id) {
    currentDraft = {
      id: row.draft_id,
      threadId: row.draft_thread_id ?? row.id,
      gmailDraftId: row.draft_gmail_draft_id ?? null,
      status: row.draft_status ?? "generated",
      subject: row.draft_subject ?? null,
      recipientEmails: parseJsonArray(row.draft_recipient_emails_json),
      plainText: row.draft_plain_text ?? "",
      html: row.draft_html ?? null,
      originalPlainText: row.draft_original_plain_text ?? null,
      originalHtml: row.draft_original_html ?? null,
      templateUsed: row.draft_template_used ?? null,
      quality: parseJsonObject(row.draft_quality_json),
      interpret: parseJsonObject(row.draft_interpret_json),
      createdByUid: row.draft_created_by_uid ?? null,
      createdAt: row.draft_created_at ?? row.created_at,
      updatedAt: row.draft_updated_at ?? row.updated_at,
    };
  }

  return {
    id: row.id,
    source: "email",
    status: row.status,
    channel: channelAdapter.channel,
    channelLabel: channelAdapter.channelLabel,
    lane: channelAdapter.lane,
    reviewMode: channelAdapter.reviewMode,
    capabilities: { ...channelAdapter.capabilities },
    subject: row.subject,
    snippet: row.snippet,
    latestMessageAt: row.latest_message_at,
    lastSyncedAt: row.last_synced_at,
    updatedAt: row.updated_at,
    needsManualDraft: Boolean(metadata.needsManualDraft),
    draftFailureCode: metadata.draftFailureCode ?? null,
    draftFailureMessage: metadata.draftFailureMessage ?? null,
    latestAdmissionDecision: metadata.latestAdmissionDecision ?? null,
    latestAdmissionReason: metadata.latestAdmissionReason ?? null,
    currentDraft,
    guestBookingRef: metadata.guestBookingRef ?? null,
    guestFirstName: metadata.guestFirstName ?? null,
    guestLastName: metadata.guestLastName ?? null,
  };
}
