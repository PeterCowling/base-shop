import "server-only";

import { z } from "zod";

import type { D1Database } from "@acme/platform-core/d1";

import { getInboxDb } from "./db.server";

export const inboxThreadStatuses = [
  "pending",
  "review_later",
  "auto_archived",
  "drafted",
  "approved",
  "sent",
  "resolved",
] as const;

export type InboxThreadStatus = (typeof inboxThreadStatuses)[number];

export const inboxDraftStatuses = [
  "generated",
  "edited",
  "approved",
  "sent",
] as const;

export type InboxDraftStatus = (typeof inboxDraftStatuses)[number];

export const inboxMessageDirections = ["inbound", "outbound"] as const;

export type InboxMessageDirection = (typeof inboxMessageDirections)[number];

export type InboxThreadRow = {
  id: string;
  status: InboxThreadStatus;
  subject: string | null;
  snippet: string | null;
  assigned_uid: string | null;
  latest_message_at: string | null;
  latest_message_direction?: InboxMessageDirection | null;
  last_synced_at: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
  // Promoted metadata columns (0006 migration)
  latest_inbound_message_id?: string | null;
  latest_inbound_at?: string | null;
  latest_inbound_sender?: string | null;
  latest_admission_decision?: string | null;
  latest_admission_reason?: string | null;
  needs_manual_draft?: number | null;
  draft_failure_code?: string | null;
  draft_failure_message?: string | null;
  last_processed_at?: string | null;
  last_draft_id?: string | null;
  last_draft_template_subject?: string | null;
  last_draft_quality_passed?: number | null;
  guest_booking_ref?: string | null;
  guest_occupant_id?: string | null;
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_check_in?: string | null;
  guest_check_out?: string | null;
  guest_room_numbers_json?: string | null;
  recovery_attempts?: number | null;
};

export type InboxMessageRow = {
  id: string;
  thread_id: string;
  direction: InboxMessageDirection;
  sender_email: string | null;
  recipient_emails_json: string | null;
  subject: string | null;
  snippet: string | null;
  sent_at: string | null;
  payload_json: string | null;
  created_at: string;
};

export type InboxDraftRow = {
  id: string;
  thread_id: string;
  gmail_draft_id: string | null;
  status: InboxDraftStatus;
  subject: string | null;
  recipient_emails_json: string | null;
  plain_text: string;
  html: string | null;
  original_plain_text: string | null;
  original_html: string | null;
  template_used: string | null;
  quality_json: string | null;
  interpret_json: string | null;
  created_by_uid: string | null;
  created_at: string;
  updated_at: string;
};

export type ThreadEventRow = {
  id: number;
  thread_id: string;
  event_type: string;
  actor_uid: string | null;
  timestamp: string;
  metadata_json: string | null;
};

export type AdmissionOutcomeRow = {
  id: number;
  thread_id: string;
  decision: string;
  source: string;
  classifier_version: string | null;
  matched_rule: string | null;
  source_metadata_json: string | null;
  created_at: string;
};

export type InboxThreadRecord = {
  thread: InboxThreadRow;
  messages: InboxMessageRow[];
  drafts: InboxDraftRow[];
  events: ThreadEventRow[];
  admissionOutcomes: AdmissionOutcomeRow[];
};

export type GetThreadMessagesOptions = {
  threadId: string;
  limit?: number;
  offset?: number;
  /** Cursor-based pagination: fetch messages older than this message ID. */
  beforeId?: string;
};

export type PaginatedMessages = {
  messages: InboxMessageRow[];
  totalMessages: number;
  offset: number;
  limit: number;
  /** True when more messages exist beyond this page. */
  hasMore: boolean;
};

export type ListThreadsOptions = {
  status?: InboxThreadStatus;
  limit?: number;
  offset?: number;
};

export type ListThreadEventsOptions = {
  threadId?: string;
  eventType?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
};

export type CreateThreadInput = {
  id: string;
  status?: InboxThreadStatus;
  subject?: string | null;
  snippet?: string | null;
  assignedUid?: string | null;
  latestMessageAt?: string | null;
  lastSyncedAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UpdateThreadStatusInput = {
  threadId: string;
  status: InboxThreadStatus;
  assignedUid?: string | null;
  latestMessageAt?: string | null;
  lastSyncedAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type CreateMessageInput = {
  id: string;
  threadId: string;
  direction: InboxMessageDirection;
  senderEmail?: string | null;
  recipientEmails?: string[] | null;
  subject?: string | null;
  snippet?: string | null;
  sentAt?: string | null;
  payload?: Record<string, unknown> | null;
};

export type CreateDraftInput = {
  id?: string;
  threadId: string;
  gmailDraftId?: string | null;
  status?: InboxDraftStatus;
  subject?: string | null;
  recipientEmails?: string[] | null;
  plainText: string;
  html?: string | null;
  originalPlainText?: string | null;
  originalHtml?: string | null;
  templateUsed?: string | null;
  quality?: Record<string, unknown> | null;
  interpret?: Record<string, unknown> | null;
  createdByUid?: string | null;
};

export type UpdateDraftInput = {
  draftId: string;
  gmailDraftId?: string | null;
  status?: InboxDraftStatus;
  subject?: string | null;
  recipientEmails?: string[] | null;
  plainText?: string;
  html?: string | null;
  originalPlainText?: string | null;
  originalHtml?: string | null;
  templateUsed?: string | null;
  quality?: Record<string, unknown> | null;
  interpret?: Record<string, unknown> | null;
  createdByUid?: string | null;
};

export type CreateEventInput = {
  threadId: string;
  eventType: string;
  actorUid?: string | null;
  timestamp?: string;
  metadata?: Record<string, unknown> | null;
};

export type RecordAdmissionInput = {
  threadId: string;
  decision: string;
  source: string;
  classifierVersion?: string | null;
  matchedRule?: string | null;
  sourceMetadata?: Record<string, unknown> | null;
};

/**
 * Zod schema for thread metadata_json.
 * Validates shape before writing to DB. Unknown keys are stripped (not rejected)
 * so legacy or experimental fields don't block writes.
 */
export const threadMetadataSchema = z.object({
  latestInboundMessageId: z.string().nullish(),
  latestInboundAt: z.string().nullish(),
  latestInboundSender: z.string().nullish(),
  latestAdmissionDecision: z.string().nullish(),
  latestAdmissionReason: z.string().nullish(),
  needsManualDraft: z.boolean().nullish(),
  draftFailureCode: z.string().nullish(),
  draftFailureMessage: z.string().nullish(),
  draftFailureChecks: z.array(z.string()).nullish(),
  lastProcessedAt: z.string().nullish(),
  lastDraftId: z.string().nullish(),
  lastDraftTemplateSubject: z.string().nullish(),
  lastDraftQualityPassed: z.boolean().nullish(),
  guestBookingRef: z.string().nullish(),
  guestOccupantId: z.string().nullish(),
  guestFirstName: z.string().nullish(),
  guestLastName: z.string().nullish(),
  guestCheckIn: z.string().nullish(),
  guestCheckOut: z.string().nullish(),
  guestRoomNumbers: z.array(z.string()).nullish(),
  recoveryAttempts: z.number().int().nullish(),
  gmailHistoryId: z.string().nullish(),
  lastSyncMode: z.string().nullish(),
});

export type ValidatedThreadMetadata = z.infer<typeof threadMetadataSchema>;

/**
 * Validate metadata before writing to DB. Unknown keys are silently stripped.
 * If known fields have wrong types, logs a warning and keeps only valid fields.
 */
function validateMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!metadata) {
    return null;
  }

  const result = threadMetadataSchema.safeParse(metadata);
  if (result.success) {
    return result.data as Record<string, unknown>;
  }

  console.warn(
    "[inbox-metadata-validation] Invalid metadata fields stripped before write:",
    result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  );

  // Fallback: strip individual fields that failed validation by making them all optional
  const lenient = threadMetadataSchema.partial().safeParse(
    Object.fromEntries(
      Object.entries(metadata).filter(([key]) => {
        // Keep only fields whose individual validation passes
        const fieldSchema = threadMetadataSchema.shape[key as keyof typeof threadMetadataSchema.shape];
        return !fieldSchema || fieldSchema.safeParse(metadata[key]).success;
      }),
    ),
  );
  return lenient.success ? (lenient.data as Record<string, unknown>) : null;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Clamp a caller-supplied limit to the range [1, 200].
 *
 * The hard upper bound of 200 prevents runaway queries from fetching unbounded
 * result sets -- D1 row limits and Cloudflare Worker memory are the binding
 * constraints. If a caller omits the limit, `fallback` is used instead.
 */
function clampLimit(limit: number | undefined, fallback: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) {
    return fallback;
  }
  return Math.min(Math.max(Math.trunc(limit), 1), 200);
}

function clampOffset(offset: number | undefined): number {
  if (typeof offset !== "number" || Number.isNaN(offset)) {
    return 0;
  }
  return Math.max(Math.trunc(offset), 0);
}

function stringifyJson(value: Record<string, unknown> | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return JSON.stringify(value);
}

function stringifyArray(value: string[] | null | undefined): string | null {
  if (!value || value.length === 0) {
    return null;
  }
  return JSON.stringify(value);
}

function generateDraftId(): string {
  return `draft_${crypto.randomUUID()}`;
}

async function inboxDb(db?: D1Database): Promise<D1Database> {
  return db ?? await getInboxDb();
}

export async function listThreads(
  options: ListThreadsOptions = {},
  db?: D1Database,
): Promise<InboxThreadRow[]> {
  const activeDb = await inboxDb(db);
  const binds: unknown[] = [];
  const conditions: string[] = [];

  if (options.status) {
    conditions.push("status = ?");
    binds.push(options.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = clampLimit(options.limit, 50);
  const offset = clampOffset(options.offset);

  const result = await activeDb
    .prepare(
      `
      SELECT
        id,
        status,
        subject,
        snippet,
        assigned_uid,
        latest_message_at,
        (
          SELECT m.direction FROM messages m
          WHERE m.thread_id = threads.id
          ORDER BY COALESCE(m.sent_at, m.created_at) DESC, m.created_at DESC
          LIMIT 1
        ) AS latest_message_direction,
        last_synced_at,
        metadata_json,
        latest_inbound_message_id,
        latest_inbound_at,
        latest_inbound_sender,
        latest_admission_decision,
        latest_admission_reason,
        needs_manual_draft,
        draft_failure_code,
        draft_failure_message,
        last_processed_at,
        last_draft_id,
        last_draft_template_subject,
        last_draft_quality_passed,
        guest_booking_ref,
        guest_occupant_id,
        guest_first_name,
        guest_last_name,
        guest_check_in,
        guest_check_out,
        guest_room_numbers_json,
        recovery_attempts,
        created_at,
        updated_at
      FROM threads
      ${whereClause}
      ORDER BY COALESCE(latest_message_at, updated_at) DESC, updated_at DESC
      LIMIT ? OFFSET ?
      `
    )
    .bind(...binds, limit, offset)
    .all<InboxThreadRow>();

  return result.results ?? [];
}

export type ThreadWithLatestDraftRow = InboxThreadRow & {
  draft_id: string | null;
  draft_thread_id: string | null;
  draft_gmail_draft_id: string | null;
  draft_status: string | null;
  draft_subject: string | null;
  draft_recipient_emails_json: string | null;
  draft_plain_text: string | null;
  draft_html: string | null;
  draft_original_plain_text: string | null;
  draft_original_html: string | null;
  draft_template_used: string | null;
  draft_quality_json: string | null;
  draft_interpret_json: string | null;
  draft_created_by_uid: string | null;
  draft_created_at: string | null;
  draft_updated_at: string | null;
};

export async function listThreadsWithLatestDraft(
  options: ListThreadsOptions = {},
  db?: D1Database,
): Promise<ThreadWithLatestDraftRow[]> {
  const activeDb = await inboxDb(db);
  const binds: unknown[] = [];
  const conditions: string[] = [];

  if (options.status) {
    conditions.push("t.status = ?");
    binds.push(options.status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = clampLimit(options.limit, 50);
  const offset = clampOffset(options.offset);

  const result = await activeDb
    .prepare(
      `
      SELECT
        t.id,
        t.status,
        t.subject,
        t.snippet,
        t.assigned_uid,
        t.latest_message_at,
        (
          SELECT m.direction FROM messages m
          WHERE m.thread_id = t.id
          ORDER BY COALESCE(m.sent_at, m.created_at) DESC, m.created_at DESC
          LIMIT 1
        ) AS latest_message_direction,
        t.last_synced_at,
        t.metadata_json,
        t.latest_inbound_message_id,
        t.latest_inbound_at,
        t.latest_inbound_sender,
        t.latest_admission_decision,
        t.latest_admission_reason,
        t.needs_manual_draft,
        t.draft_failure_code,
        t.draft_failure_message,
        t.last_processed_at,
        t.last_draft_id,
        t.last_draft_template_subject,
        t.last_draft_quality_passed,
        t.guest_booking_ref,
        t.guest_occupant_id,
        t.guest_first_name,
        t.guest_last_name,
        t.guest_check_in,
        t.guest_check_out,
        t.guest_room_numbers_json,
        t.recovery_attempts,
        t.created_at,
        t.updated_at,
        d.id AS draft_id,
        d.thread_id AS draft_thread_id,
        d.gmail_draft_id AS draft_gmail_draft_id,
        d.status AS draft_status,
        d.subject AS draft_subject,
        d.recipient_emails_json AS draft_recipient_emails_json,
        d.plain_text AS draft_plain_text,
        d.html AS draft_html,
        d.original_plain_text AS draft_original_plain_text,
        d.original_html AS draft_original_html,
        d.template_used AS draft_template_used,
        d.quality_json AS draft_quality_json,
        d.interpret_json AS draft_interpret_json,
        d.created_by_uid AS draft_created_by_uid,
        d.created_at AS draft_created_at,
        d.updated_at AS draft_updated_at
      FROM threads t
      LEFT JOIN drafts d ON d.id = (
        SELECT d2.id FROM drafts d2
        WHERE d2.thread_id = t.id
        ORDER BY d2.updated_at DESC, d2.created_at DESC
        LIMIT 1
      )
      ${whereClause}
      ORDER BY COALESCE(t.latest_message_at, t.updated_at) DESC, t.updated_at DESC
      LIMIT ? OFFSET ?
      `
    )
    .bind(...binds, limit, offset)
    .all<ThreadWithLatestDraftRow>();

  return result.results ?? [];
}

export async function listThreadEvents(
  options: ListThreadEventsOptions = {},
  db?: D1Database,
): Promise<ThreadEventRow[]> {
  const activeDb = await inboxDb(db);
  const binds: unknown[] = [];
  const conditions: string[] = [];

  if (options.threadId) {
    conditions.push("thread_id = ?");
    binds.push(options.threadId);
  }

  if (options.eventType) {
    conditions.push("event_type = ?");
    binds.push(options.eventType);
  }

  if (options.startTime) {
    conditions.push("timestamp >= ?");
    binds.push(options.startTime);
  }

  if (options.endTime) {
    conditions.push("timestamp <= ?");
    binds.push(options.endTime);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = clampLimit(options.limit, 100);
  const offset = clampOffset(options.offset);

  const result = await activeDb
    .prepare(
      `
      SELECT
        id,
        thread_id,
        event_type,
        actor_uid,
        timestamp,
        metadata_json
      FROM thread_events
      ${whereClause}
      ORDER BY timestamp DESC, id DESC
      LIMIT ? OFFSET ?
      `
    )
    .bind(...binds, limit, offset)
    .all<ThreadEventRow>();

  return result.results ?? [];
}

export async function getThread(
  threadId: string,
  db?: D1Database,
): Promise<InboxThreadRecord | null> {
  const activeDb = await inboxDb(db);
  const thread = await activeDb
    .prepare(
      `
      SELECT
        id,
        status,
        subject,
        snippet,
        assigned_uid,
        latest_message_at,
        last_synced_at,
        metadata_json,
        latest_inbound_message_id,
        latest_inbound_at,
        latest_inbound_sender,
        latest_admission_decision,
        latest_admission_reason,
        needs_manual_draft,
        draft_failure_code,
        draft_failure_message,
        last_processed_at,
        last_draft_id,
        last_draft_template_subject,
        last_draft_quality_passed,
        guest_booking_ref,
        guest_occupant_id,
        guest_first_name,
        guest_last_name,
        guest_check_in,
        guest_check_out,
        guest_room_numbers_json,
        recovery_attempts,
        created_at,
        updated_at
      FROM threads
      WHERE id = ?
      `
    )
    .bind(threadId)
    .first<InboxThreadRow>();

  if (!thread) {
    return null;
  }

  const [messagesResult, draftsResult, eventsResult, admissionsResult] = await Promise.all([
    activeDb
      .prepare(
        `
        SELECT
          id,
          thread_id,
          direction,
          sender_email,
          recipient_emails_json,
          subject,
          snippet,
          sent_at,
          payload_json,
          created_at
        FROM messages
        WHERE thread_id = ?
        ORDER BY COALESCE(sent_at, created_at) ASC, created_at ASC
        `
      )
      .bind(threadId)
      .all<InboxMessageRow>(),
    activeDb
      .prepare(
        `
        SELECT
          id,
          thread_id,
          gmail_draft_id,
          status,
          subject,
          recipient_emails_json,
          plain_text,
          html,
          original_plain_text,
          original_html,
          template_used,
          quality_json,
          interpret_json,
          created_by_uid,
          created_at,
          updated_at
        FROM drafts
        WHERE thread_id = ?
        ORDER BY updated_at DESC, created_at DESC
        `
      )
      .bind(threadId)
      .all<InboxDraftRow>(),
    activeDb
      .prepare(
        `
        SELECT
          id,
          thread_id,
          event_type,
          actor_uid,
          timestamp,
          metadata_json
        FROM thread_events
        WHERE thread_id = ?
        ORDER BY timestamp ASC, id ASC
        `
      )
      .bind(threadId)
      .all<ThreadEventRow>(),
    activeDb
      .prepare(
        `
        SELECT
          id,
          thread_id,
          decision,
          source,
          classifier_version,
          matched_rule,
          source_metadata_json,
          created_at
        FROM admission_outcomes
        WHERE thread_id = ?
        ORDER BY created_at DESC, id DESC
        `
      )
      .bind(threadId)
      .all<AdmissionOutcomeRow>(),
  ]);

  return {
    thread,
    messages: messagesResult.results ?? [],
    drafts: draftsResult.results ?? [],
    events: eventsResult.results ?? [],
    admissionOutcomes: admissionsResult.results ?? [],
  };
}

/**
 * Fetch a page of messages for a thread.
 *
 * The `limit` is clamped to a maximum of 200 via {@link clampLimit} to stay
 * within D1 memory constraints. Callers that need more messages should
 * paginate using the returned `offset` / `hasMore` fields.
 */
export async function getThreadMessages(
  options: GetThreadMessagesOptions,
  db?: D1Database,
): Promise<PaginatedMessages> {
  const activeDb = await inboxDb(db);
  const limit = clampLimit(options.limit, 20);
  const offset = clampOffset(options.offset);

  // Cursor-based path: fetch messages older than `beforeId` (stable under concurrent inserts)
  if (options.beforeId) {
    const [countResult, messagesResult] = await Promise.all([
      activeDb
        .prepare(
          `SELECT COUNT(*) AS cnt FROM messages WHERE thread_id = ?`,
        )
        .bind(options.threadId)
        .first<{ cnt: number }>(),
      activeDb
        .prepare(
          `
          SELECT
            id,
            thread_id,
            direction,
            sender_email,
            recipient_emails_json,
            subject,
            snippet,
            sent_at,
            payload_json,
            created_at
          FROM messages
          WHERE thread_id = ? AND id < ?
          ORDER BY COALESCE(sent_at, created_at) DESC, created_at DESC
          LIMIT ?
          `,
        )
        .bind(options.threadId, options.beforeId, limit)
        .all<InboxMessageRow>(),
    ]);

    const totalMessages = countResult?.cnt ?? 0;
    const rows = messagesResult.results ?? [];
    // Reverse so messages are in chronological order (oldest first) for display
    const messages = rows.reverse();
    const hasMore = rows.length === limit;

    return { messages, totalMessages, offset: 0, limit, hasMore };
  }

  // Offset-based fallback for initial load (no cursor yet)
  const [countResult, messagesResult] = await Promise.all([
    activeDb
      .prepare(
        `SELECT COUNT(*) AS cnt FROM messages WHERE thread_id = ?`,
      )
      .bind(options.threadId)
      .first<{ cnt: number }>(),
    activeDb
      .prepare(
        `
        SELECT
          id,
          thread_id,
          direction,
          sender_email,
          recipient_emails_json,
          subject,
          snippet,
          sent_at,
          payload_json,
          created_at
        FROM messages
        WHERE thread_id = ?
        ORDER BY COALESCE(sent_at, created_at) DESC, created_at DESC
        LIMIT ? OFFSET ?
        `,
      )
      .bind(options.threadId, limit, offset)
      .all<InboxMessageRow>(),
  ]);

  const totalMessages = countResult?.cnt ?? 0;
  // Reverse so messages are in chronological order (oldest first) for display
  const messages = (messagesResult.results ?? []).reverse();
  const hasMore = offset + messages.length < totalMessages;

  return { messages, totalMessages, offset, limit, hasMore };
}

export async function createThread(
  input: CreateThreadInput,
  db?: D1Database,
): Promise<InboxThreadRow> {
  const activeDb = await inboxDb(db);
  const timestamp = nowIso();

  // Validate and strip invalid metadata fields before writing
  const validatedMeta = validateMetadata(input.metadata);

  // Build column SET clauses for promoted metadata fields
  const extraColumns: string[] = [];
  const extraPlaceholders: string[] = [];
  const extraBinds: unknown[] = [];

  if (validatedMeta) {
    for (const [column, metaKey] of Object.entries(METADATA_COLUMN_MAP)) {
      if (Object.prototype.hasOwnProperty.call(validatedMeta, metaKey)) {
        extraColumns.push(column);
        extraPlaceholders.push("?");
        extraBinds.push(metadataValueForColumn(column, validatedMeta[metaKey]));
      }
    }
  }

  const columnsList = [
    "id", "status", "subject", "snippet", "assigned_uid",
    "latest_message_at", "last_synced_at", "metadata_json",
    ...extraColumns,
    "created_at", "updated_at",
  ].join(", ");

  const placeholdersList = [
    "?", "?", "?", "?", "?", "?", "?", "?",
    ...extraPlaceholders,
    "?", "?",
  ].join(", ");

  await activeDb
    .prepare(`INSERT INTO threads (${columnsList}) VALUES (${placeholdersList})`)
    .bind(
      input.id,
      input.status ?? "pending",
      input.subject ?? null,
      input.snippet ?? null,
      input.assignedUid ?? null,
      input.latestMessageAt ?? null,
      input.lastSyncedAt ?? null,
      stringifyJson(validatedMeta),
      ...extraBinds,
      timestamp,
      timestamp,
    )
    .run();

  const thread = await activeDb
    .prepare(
      `
      SELECT
        id,
        status,
        subject,
        snippet,
        assigned_uid,
        latest_message_at,
        last_synced_at,
        metadata_json,
        latest_inbound_message_id,
        latest_inbound_at,
        latest_inbound_sender,
        latest_admission_decision,
        latest_admission_reason,
        needs_manual_draft,
        draft_failure_code,
        draft_failure_message,
        last_processed_at,
        last_draft_id,
        last_draft_template_subject,
        last_draft_quality_passed,
        guest_booking_ref,
        guest_occupant_id,
        guest_first_name,
        guest_last_name,
        guest_check_in,
        guest_check_out,
        guest_room_numbers_json,
        recovery_attempts,
        created_at,
        updated_at
      FROM threads
      WHERE id = ?
      `
    )
    .bind(input.id)
    .first<InboxThreadRow>();

  if (!thread) {
    throw new Error(`Thread ${input.id} was not found after insert.`);
  }

  return thread;
}

/** Column name -> metadata field key mapping for dual-write. */
const METADATA_COLUMN_MAP: Record<string, string> = {
  latest_inbound_message_id: "latestInboundMessageId",
  latest_inbound_at: "latestInboundAt",
  latest_inbound_sender: "latestInboundSender",
  latest_admission_decision: "latestAdmissionDecision",
  latest_admission_reason: "latestAdmissionReason",
  needs_manual_draft: "needsManualDraft",
  draft_failure_code: "draftFailureCode",
  draft_failure_message: "draftFailureMessage",
  last_processed_at: "lastProcessedAt",
  last_draft_id: "lastDraftId",
  last_draft_template_subject: "lastDraftTemplateSubject",
  last_draft_quality_passed: "lastDraftQualityPassed",
  guest_booking_ref: "guestBookingRef",
  guest_occupant_id: "guestOccupantId",
  guest_first_name: "guestFirstName",
  guest_last_name: "guestLastName",
  guest_check_in: "guestCheckIn",
  guest_check_out: "guestCheckOut",
  guest_room_numbers_json: "guestRoomNumbers",
  recovery_attempts: "recoveryAttempts",
};

const BOOLEAN_COLUMNS = new Set(["needs_manual_draft", "last_draft_quality_passed"]);
const ARRAY_COLUMNS = new Set(["guest_room_numbers_json"]);

function metadataValueForColumn(column: string, value: unknown): unknown {
  if (value == null) return null;
  if (BOOLEAN_COLUMNS.has(column)) return value ? 1 : 0;
  if (ARRAY_COLUMNS.has(column)) return Array.isArray(value) ? JSON.stringify(value) : value;
  return value;
}

export async function updateThreadStatus(
  input: UpdateThreadStatusInput,
  db?: D1Database,
): Promise<InboxThreadRow | null> {
  const activeDb = await inboxDb(db);
  const timestamp = nowIso();
  const updates: string[] = ["status = ?", "updated_at = ?"];
  const binds: unknown[] = [input.status, timestamp];

  if (Object.prototype.hasOwnProperty.call(input, "assignedUid")) {
    updates.push("assigned_uid = ?");
    binds.push(input.assignedUid ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "latestMessageAt")) {
    updates.push("latest_message_at = ?");
    binds.push(input.latestMessageAt ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "lastSyncedAt")) {
    updates.push("last_synced_at = ?");
    binds.push(input.lastSyncedAt ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "metadata")) {
    // Validate and strip invalid fields before writing
    const validatedMeta = validateMetadata(input.metadata);

    // Dual-write: metadata_json blob + individual columns
    updates.push("metadata_json = ?");
    binds.push(stringifyJson(validatedMeta));

    // Write promoted columns from the validated metadata object
    if (validatedMeta) {
      for (const [column, metaKey] of Object.entries(METADATA_COLUMN_MAP)) {
        if (Object.prototype.hasOwnProperty.call(validatedMeta, metaKey)) {
          updates.push(`${column} = ?`);
          binds.push(metadataValueForColumn(column, validatedMeta[metaKey]));
        }
      }
    }
  }

  binds.push(input.threadId);

  await activeDb
    .prepare(`UPDATE threads SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();

  const record = await getThread(input.threadId, activeDb);
  return record?.thread ?? null;
}

export async function createMessage(
  input: CreateMessageInput,
  db?: D1Database,
): Promise<InboxMessageRow> {
  const activeDb = await inboxDb(db);
  const timestamp = nowIso();

  await activeDb
    .prepare(
      `
      INSERT INTO messages (
        id,
        thread_id,
        direction,
        sender_email,
        recipient_emails_json,
        subject,
        snippet,
        sent_at,
        payload_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      input.id,
      input.threadId,
      input.direction,
      input.senderEmail ?? null,
      stringifyArray(input.recipientEmails),
      input.subject ?? null,
      input.snippet ?? null,
      input.sentAt ?? null,
      stringifyJson(input.payload),
      timestamp,
    )
    .run();

  const message = await activeDb
    .prepare(
      `
      SELECT
        id,
        thread_id,
        direction,
        sender_email,
        recipient_emails_json,
        subject,
        snippet,
        sent_at,
        payload_json,
        created_at
      FROM messages
      WHERE id = ?
      `
    )
    .bind(input.id)
    .first<InboxMessageRow>();

  if (!message) {
    throw new Error(`Message ${input.id} was not found after insert.`);
  }

  return message;
}

export async function createDraft(
  input: CreateDraftInput,
  db?: D1Database,
): Promise<InboxDraftRow> {
  const activeDb = await inboxDb(db);
  const draftId = input.id ?? generateDraftId();
  const timestamp = nowIso();

  await activeDb
    .prepare(
      `
      INSERT INTO drafts (
        id,
        thread_id,
        gmail_draft_id,
        status,
        subject,
        recipient_emails_json,
        plain_text,
        html,
        original_plain_text,
        original_html,
        template_used,
        quality_json,
        interpret_json,
        created_by_uid,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      draftId,
      input.threadId,
      input.gmailDraftId ?? null,
      input.status ?? "generated",
      input.subject ?? null,
      stringifyArray(input.recipientEmails),
      input.plainText,
      input.html ?? null,
      input.originalPlainText ?? null,
      input.originalHtml ?? null,
      input.templateUsed ?? null,
      stringifyJson(input.quality),
      stringifyJson(input.interpret),
      input.createdByUid ?? null,
      timestamp,
      timestamp,
    )
    .run();

  const draft = await activeDb
    .prepare(
      `
      SELECT
        id,
        thread_id,
        gmail_draft_id,
        status,
        subject,
        recipient_emails_json,
        plain_text,
        html,
        original_plain_text,
        original_html,
        template_used,
        quality_json,
        interpret_json,
        created_by_uid,
        created_at,
        updated_at
      FROM drafts
      WHERE id = ?
      `
    )
    .bind(draftId)
    .first<InboxDraftRow>();

  if (!draft) {
    throw new Error(`Draft ${draftId} was not found after insert.`);
  }

  return draft;
}

/**
 * Atomically creates a draft only if no pending draft (status = 'generated')
 * already exists for the given thread. Returns the existing draft if one was
 * found, or the newly created draft otherwise.
 *
 * Uses INSERT ... WHERE NOT EXISTS to avoid the TOCTOU race where two
 * concurrent sync runs both see "no draft" and both insert.
 */
export type CreateDraftIfNotExistsResult = {
  draft: InboxDraftRow;
  /** True when a new row was inserted; false when an existing pending draft was returned. */
  created: boolean;
};

export async function createDraftIfNotExists(
  input: CreateDraftInput,
  db?: D1Database,
): Promise<CreateDraftIfNotExistsResult> {
  const activeDb = await inboxDb(db);
  const draftId = input.id ?? generateDraftId();
  const timestamp = nowIso();

  const insertResult = await activeDb
    .prepare(
      `
      INSERT INTO drafts (
        id,
        thread_id,
        gmail_draft_id,
        status,
        subject,
        recipient_emails_json,
        plain_text,
        html,
        original_plain_text,
        original_html,
        template_used,
        quality_json,
        interpret_json,
        created_by_uid,
        created_at,
        updated_at
      )
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (
        SELECT 1 FROM drafts
        WHERE thread_id = ? AND status = 'generated'
      )
      `
    )
    .bind(
      draftId,
      input.threadId,
      input.gmailDraftId ?? null,
      input.status ?? "generated",
      input.subject ?? null,
      stringifyArray(input.recipientEmails),
      input.plainText,
      input.html ?? null,
      input.originalPlainText ?? null,
      input.originalHtml ?? null,
      input.templateUsed ?? null,
      stringifyJson(input.quality),
      stringifyJson(input.interpret),
      input.createdByUid ?? null,
      timestamp,
      timestamp,
      // WHERE NOT EXISTS bind:
      input.threadId,
    )
    .run();

  const rowsWritten = insertResult.meta?.changes ?? 0;

  if (rowsWritten > 0) {
    // New draft was inserted
    const draft = await activeDb
      .prepare(
        `
        SELECT
          id, thread_id, gmail_draft_id, status, subject,
          recipient_emails_json, plain_text, html,
          original_plain_text, original_html, template_used,
          quality_json, interpret_json, created_by_uid,
          created_at, updated_at
        FROM drafts WHERE id = ?
        `
      )
      .bind(draftId)
      .first<InboxDraftRow>();

    if (!draft) {
      throw new Error(`Draft ${draftId} was not found after insert.`);
    }
    return { draft, created: true };
  }

  // Insert was skipped — a pending draft already exists
  const existing = await activeDb
    .prepare(
      `
      SELECT
        id, thread_id, gmail_draft_id, status, subject,
        recipient_emails_json, plain_text, html,
        original_plain_text, original_html, template_used,
        quality_json, interpret_json, created_by_uid,
        created_at, updated_at
      FROM drafts
      WHERE thread_id = ? AND status = 'generated'
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
      `
    )
    .bind(input.threadId)
    .first<InboxDraftRow>();

  if (!existing) {
    // Extremely unlikely race: the draft that blocked the insert was
    // updated/deleted between our INSERT and this SELECT. Fall back to
    // a normal insert.
    return { draft: await createDraft(input, activeDb), created: true };
  }

  return { draft: existing, created: false };
}

export async function updateDraft(
  input: UpdateDraftInput,
  db?: D1Database,
): Promise<InboxDraftRow | null> {
  const activeDb = await inboxDb(db);
  const updates: string[] = ["updated_at = ?"];
  const binds: unknown[] = [nowIso()];

  if (Object.prototype.hasOwnProperty.call(input, "gmailDraftId")) {
    updates.push("gmail_draft_id = ?");
    binds.push(input.gmailDraftId ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "status")) {
    updates.push("status = ?");
    binds.push(input.status);
  }

  if (Object.prototype.hasOwnProperty.call(input, "subject")) {
    updates.push("subject = ?");
    binds.push(input.subject ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "recipientEmails")) {
    updates.push("recipient_emails_json = ?");
    binds.push(stringifyArray(input.recipientEmails));
  }

  if (Object.prototype.hasOwnProperty.call(input, "plainText")) {
    updates.push("plain_text = ?");
    binds.push(input.plainText);
  }

  if (Object.prototype.hasOwnProperty.call(input, "html")) {
    updates.push("html = ?");
    binds.push(input.html ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "originalPlainText")) {
    updates.push("original_plain_text = ?");
    binds.push(input.originalPlainText ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "originalHtml")) {
    updates.push("original_html = ?");
    binds.push(input.originalHtml ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "templateUsed")) {
    updates.push("template_used = ?");
    binds.push(input.templateUsed ?? null);
  }

  if (Object.prototype.hasOwnProperty.call(input, "quality")) {
    updates.push("quality_json = ?");
    binds.push(stringifyJson(input.quality));
  }

  if (Object.prototype.hasOwnProperty.call(input, "interpret")) {
    updates.push("interpret_json = ?");
    binds.push(stringifyJson(input.interpret));
  }

  if (Object.prototype.hasOwnProperty.call(input, "createdByUid")) {
    updates.push("created_by_uid = ?");
    binds.push(input.createdByUid ?? null);
  }

  binds.push(input.draftId);

  await activeDb
    .prepare(`UPDATE drafts SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...binds)
    .run();

  const draft = await activeDb
    .prepare(
      `
      SELECT
        id,
        thread_id,
        gmail_draft_id,
        status,
        subject,
        recipient_emails_json,
        plain_text,
        html,
        original_plain_text,
        original_html,
        template_used,
        quality_json,
        interpret_json,
        created_by_uid,
        created_at,
        updated_at
      FROM drafts
      WHERE id = ?
      `
    )
    .bind(input.draftId)
    .first<InboxDraftRow>();

  return draft ?? null;
}

export async function createEvent(
  input: CreateEventInput,
  db?: D1Database,
): Promise<ThreadEventRow> {
  const activeDb = await inboxDb(db);
  const timestamp = input.timestamp ?? nowIso();

  const eventResult = await activeDb
    .prepare(
      `
      INSERT INTO thread_events (
        thread_id,
        event_type,
        actor_uid,
        timestamp,
        metadata_json
      ) VALUES (?, ?, ?, ?, ?)
      `
    )
    .bind(
      input.threadId,
      input.eventType,
      input.actorUid ?? null,
      timestamp,
      stringifyJson(input.metadata),
    )
    .run();

  const lastRowId = eventResult.meta?.last_row_id;
  if (typeof lastRowId !== "number") {
    throw new Error("Thread event insert did not return a last_row_id.");
  }

  const event = await activeDb
    .prepare(
      `
      SELECT
        id,
        thread_id,
        event_type,
        actor_uid,
        timestamp,
        metadata_json
      FROM thread_events
      WHERE id = ?
      `
    )
    .bind(lastRowId)
    .first<ThreadEventRow>();

  if (!event) {
    throw new Error(`Thread event ${String(lastRowId)} was not found after insert.`);
  }

  return event;
}

export async function findStaleAdmittedThreads(
  db: D1Database,
  staleThresholdMs: number,
  limit?: number,
): Promise<InboxThreadRow[]> {
  const activeDb = await inboxDb(db);
  const staleThreshold = new Date(Date.now() - staleThresholdMs).toISOString();
  const effectiveLimit = clampLimit(limit, 20);

  const result = await activeDb
    .prepare(
      `
      SELECT
        t.id,
        t.status,
        t.subject,
        t.snippet,
        t.assigned_uid,
        t.latest_message_at,
        t.last_synced_at,
        t.metadata_json,
        t.latest_inbound_message_id,
        t.latest_inbound_at,
        t.latest_inbound_sender,
        t.latest_admission_decision,
        t.latest_admission_reason,
        t.needs_manual_draft,
        t.draft_failure_code,
        t.draft_failure_message,
        t.last_processed_at,
        t.last_draft_id,
        t.last_draft_template_subject,
        t.last_draft_quality_passed,
        t.guest_booking_ref,
        t.guest_occupant_id,
        t.guest_first_name,
        t.guest_last_name,
        t.guest_check_in,
        t.guest_check_out,
        t.guest_room_numbers_json,
        t.recovery_attempts,
        t.created_at,
        t.updated_at
      FROM threads t
      WHERE t.status = 'pending'
        AND t.updated_at < ?
        AND EXISTS (
          SELECT 1 FROM admission_outcomes ao
          WHERE ao.thread_id = t.id
            AND ao.decision = 'admit'
            AND ao.id = (
              SELECT ao2.id FROM admission_outcomes ao2
              WHERE ao2.thread_id = t.id
              ORDER BY ao2.created_at DESC, ao2.id DESC
              LIMIT 1
            )
        )
        AND NOT EXISTS (
          SELECT 1 FROM drafts d WHERE d.thread_id = t.id
        )
        AND (t.needs_manual_draft IS NULL OR t.needs_manual_draft != 1)
      ORDER BY t.updated_at ASC
      LIMIT ?
      `
    )
    .bind(staleThreshold, effectiveLimit)
    .all<InboxThreadRow>();

  return result.results ?? [];
}

export async function recordAdmission(
  input: RecordAdmissionInput,
  db?: D1Database,
): Promise<AdmissionOutcomeRow> {
  const activeDb = await inboxDb(db);
  const classifierVersion = input.classifierVersion ?? null;
  const timestamp = nowIso();

  // Upsert keyed on (thread_id, classifier_version) to prevent duplicate
  // admission rows accumulating on every sync run.
  const insertResult = await activeDb
    .prepare(
      `
      INSERT INTO admission_outcomes (
        thread_id,
        decision,
        source,
        classifier_version,
        matched_rule,
        source_metadata_json,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(thread_id, classifier_version) DO UPDATE SET
        decision = excluded.decision,
        source = excluded.source,
        matched_rule = excluded.matched_rule,
        source_metadata_json = excluded.source_metadata_json,
        created_at = excluded.created_at
      `
    )
    .bind(
      input.threadId,
      input.decision,
      input.source,
      classifierVersion,
      input.matchedRule ?? null,
      stringifyJson(input.sourceMetadata),
      timestamp,
    )
    .run();

  const lastRowId = insertResult.meta?.last_row_id;
  if (typeof lastRowId !== "number") {
    throw new Error("Admission outcome upsert did not return a last_row_id.");
  }

  const admission = await activeDb
    .prepare(
      `
      SELECT
        id,
        thread_id,
        decision,
        source,
        classifier_version,
        matched_rule,
        source_metadata_json,
        created_at
      FROM admission_outcomes
      WHERE id = ?
      `
    )
    .bind(lastRowId)
    .first<AdmissionOutcomeRow>();

  if (!admission) {
    throw new Error(`Admission outcome ${String(lastRowId)} was not found after insert.`);
  }

  return admission;
}
