import "server-only";

import type { ParsedGmailThread } from "../gmail-client";

import type {
  InboxDraftRow,
  InboxMessageRow,
  InboxThreadRecord,
  InboxThreadRow,
} from "./repositories.server";

export type InboxThreadMetadata = {
  needsManualDraft?: boolean;
  draftFailureCode?: string | null;
  draftFailureMessage?: string | null;
  lastDraftId?: string | null;
  lastDraftTemplateSubject?: string | null;
  lastDraftQualityPassed?: boolean;
  latestInboundMessageId?: string | null;
  latestAdmissionDecision?: string | null;
  latestAdmissionReason?: string | null;
  guestBookingRef?: string | null;
  guestOccupantId?: string | null;
  guestFirstName?: string | null;
  guestLastName?: string | null;
  guestCheckIn?: string | null;
  guestCheckOut?: string | null;
  guestRoomNumbers?: string[] | null;
};

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

function parseJsonArray(raw: string | null | undefined): string[] {
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

export function parseThreadMetadata(raw: string | null | undefined): InboxThreadMetadata {
  const parsed = parseJsonObject(raw);
  return parsed ? (parsed as InboxThreadMetadata) : {};
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

export function buildThreadSummary(record: InboxThreadRecord): {
  id: string;
  status: string;
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
} {
  const metadata = parseThreadMetadata(record.thread.metadata_json);
  const currentDraft = getCurrentDraft(record);

  return {
    id: record.thread.id,
    status: record.thread.status,
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
  return thread.status !== "auto_archived" && thread.status !== "resolved";
}

export function buildThreadSummaryFromRow(row: import("./repositories.server").ThreadWithLatestDraftRow): {
  id: string;
  status: string;
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
} {
  const metadata = parseThreadMetadata(row.metadata_json);

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
    status: row.status,
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
