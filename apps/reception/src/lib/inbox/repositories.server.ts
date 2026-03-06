import "server-only";

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
  last_synced_at: string | null;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
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

function nowIso(): string {
  return new Date().toISOString();
}

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

function inboxDb(db?: D1Database): D1Database {
  return db ?? getInboxDb();
}

export async function listThreads(
  options: ListThreadsOptions = {},
  db?: D1Database,
): Promise<InboxThreadRow[]> {
  const activeDb = inboxDb(db);
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
        last_synced_at,
        metadata_json,
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

export async function listThreadEvents(
  options: ListThreadEventsOptions = {},
  db?: D1Database,
): Promise<ThreadEventRow[]> {
  const activeDb = inboxDb(db);
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
  const activeDb = inboxDb(db);
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

export async function createThread(
  input: CreateThreadInput,
  db?: D1Database,
): Promise<InboxThreadRow> {
  const activeDb = inboxDb(db);
  const timestamp = nowIso();

  await activeDb
    .prepare(
      `
      INSERT INTO threads (
        id,
        status,
        subject,
        snippet,
        assigned_uid,
        latest_message_at,
        last_synced_at,
        metadata_json,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      input.id,
      input.status ?? "pending",
      input.subject ?? null,
      input.snippet ?? null,
      input.assignedUid ?? null,
      input.latestMessageAt ?? null,
      input.lastSyncedAt ?? null,
      stringifyJson(input.metadata),
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

export async function updateThreadStatus(
  input: UpdateThreadStatusInput,
  db?: D1Database,
): Promise<InboxThreadRow | null> {
  const activeDb = inboxDb(db);
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
    updates.push("metadata_json = ?");
    binds.push(stringifyJson(input.metadata));
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
  const activeDb = inboxDb(db);
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
  const activeDb = inboxDb(db);
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
        template_used,
        quality_json,
        interpret_json,
        created_by_uid,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

export async function updateDraft(
  input: UpdateDraftInput,
  db?: D1Database,
): Promise<InboxDraftRow | null> {
  const activeDb = inboxDb(db);
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
  const activeDb = inboxDb(db);
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

export async function recordAdmission(
  input: RecordAdmissionInput,
  db?: D1Database,
): Promise<AdmissionOutcomeRow> {
  const activeDb = inboxDb(db);
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
      `
    )
    .bind(
      input.threadId,
      input.decision,
      input.source,
      input.classifierVersion ?? null,
      input.matchedRule ?? null,
      stringifyJson(input.sourceMetadata),
      nowIso(),
    )
    .run();

  const lastRowId = insertResult.meta?.last_row_id;
  if (typeof lastRowId !== "number") {
    throw new Error("Admission outcome insert did not return a last_row_id.");
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
