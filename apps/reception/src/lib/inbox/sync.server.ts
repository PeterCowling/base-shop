import "server-only";

import type { D1Database, D1PreparedStatement } from "@acme/platform-core/d1";

import {
  getGmailProfile,
  getGmailThread,
  listGmailHistory,
  listGmailThreads,
  type ParsedGmailThread,
  type ParsedGmailThreadMessage,
} from "../gmail-client";

import {
  type AdmissionDecision,
  classifyForAdmission,
} from "./admission";
import { getCurrentDraft, getPendingDraft, type ThreadMetadata } from "./api-models.server";
import { getInboxDb } from "./db.server";
import { deriveDraftFailureReason, generateAgentDraft } from "./draft-pipeline.server";
import {
  buildGuestEmailMap,
  type GuestEmailMap,
  type GuestEmailMapResult,
  matchSenderToGuest,
} from "./guest-matcher.server";
import {
  createDraftIfNotExists,
  getThread,
  type InboxThreadStatus,
  recordAdmission,
  updateDraft,
  updateThreadStatus,
} from "./repositories.server";
import {
  getInboxSyncCheckpoint,
  upsertInboxSyncCheckpoint,
} from "./sync-state.server";
import { recordInboxEvent } from "./telemetry.server";
import { buildThreadContext as buildBoundThreadContext } from "./thread-context";

const DEFAULT_MAILBOX_KEY = "primary";
const DEFAULT_RESCAN_WINDOW_DAYS = 30;
const HISTORY_PAGE_SIZE = 200;
const THREAD_PAGE_SIZE = 100;
const STALE_HISTORY_ERROR = "Requested entity was not found.";
type SyncMode = "incremental" | "initial_rescan" | "bounded_rescan";

/** Sync uses the canonical ThreadMetadata type from api-models.server.ts */
type SyncThreadMetadata = ThreadMetadata;

export type SyncInboxInput = {
  actorUid?: string | null;
  mailboxKey?: string;
  rescanWindowDays?: number;
};

export type SyncInboxResult = {
  mailboxKey: string;
  mode: SyncMode;
  checkpointAdvanced: boolean;
  checkpoint: {
    previousHistoryId: string | null;
    nextHistoryId: string;
  };
  counts: {
    historyRecords: number;
    threadsFetched: number;
    threadsUpserted: number;
    messagesUpserted: number;
    admitted: number;
    autoArchived: number;
    reviewLater: number;
    draftsCreated: number;
    manualDraftFlags: number;
    skippedUnchanged: number;
    threadErrors: number;
  };
};

function nowIso(): string {
  return new Date().toISOString();
}

function parseMetadata(raw: string | null | undefined): SyncThreadMetadata {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as SyncThreadMetadata) : {};
  } catch (parseError) {
    console.warn("[sync] metadata parse failed", {
      raw: raw.length > 200 ? `${raw.slice(0, 200)}…` : raw,
      error: parseError instanceof Error ? parseError.message : String(parseError),
    });
    return {};
  }
}

export function extractEmailAddress(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const angleMatch = value.match(/<([^>]+)>/);
  if (angleMatch?.[1]) {
    return angleMatch[1].trim().toLowerCase();
  }

  const trimmed = value.trim().toLowerCase();
  return trimmed.includes("@") ? trimmed : null;
}

function isInboundMessage(
  message: ParsedGmailThreadMessage,
  mailboxEmail: string,
): boolean {
  const senderEmail = extractEmailAddress(message.from);
  return Boolean(senderEmail) && senderEmail !== mailboxEmail.toLowerCase();
}

function compareMessagesByDate(
  left: ParsedGmailThreadMessage,
  right: ParsedGmailThreadMessage,
): number {
  const leftDate = left.receivedAt ?? left.internalDate ?? "";
  const rightDate = right.receivedAt ?? right.internalDate ?? "";
  return leftDate.localeCompare(rightDate);
}

export function getLatestInboundMessage(
  thread: ParsedGmailThread,
  mailboxEmail: string,
): ParsedGmailThreadMessage | null {
  const inbound = thread.messages.filter((message) => isInboundMessage(message, mailboxEmail));
  if (inbound.length === 0) {
    return null;
  }

  return [...inbound].sort(compareMessagesByDate).at(-1) ?? null;
}

export const buildThreadContext = buildBoundThreadContext;

function ensureReplySubject(subject: string | null | undefined): string {
  const trimmed = subject?.trim();
  if (!trimmed) {
    return "Re: Guest inquiry";
  }
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

function buildDraftRecipients(message: ParsedGmailThreadMessage): string[] {
  const senderEmail = extractEmailAddress(message.from);
  return senderEmail ? [senderEmail] : [];
}

export function inferPrepaymentProvider(
  message: ParsedGmailThreadMessage,
): "octorate" | "hostelworld" | undefined {
  const haystack = `${message.from ?? ""} ${message.subject ?? ""} ${message.body.plain}`.toLowerCase();
  if (haystack.includes("hostelworld")) {
    return "hostelworld";
  }
  if (haystack.includes("octorate") || haystack.includes("smtp.octorate.com")) {
    return "octorate";
  }
  return undefined;
}

function inferProviderFromBookingRef(
  bookingRef: string | null | undefined,
): "octorate" | "hostelworld" | undefined {
  const normalized = bookingRef?.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.startsWith("7763-") ? "hostelworld" : "octorate";
}

export function inferPrepaymentStep(
  message: ParsedGmailThreadMessage,
): "first" | "second" | "third" | "success" | undefined {
  const haystack = `${message.subject ?? ""} ${message.body.plain}`.toLowerCase();
  if (haystack.includes("prepayment successful")) {
    return "success";
  }
  if (haystack.includes("2nd attempt failed") || haystack.includes("second attempt failed")) {
    return "second";
  }
  if (
    haystack.includes("3rd attempt") ||
    haystack.includes("third attempt") ||
    haystack.includes("cancelled post")
  ) {
    return "third";
  }
  if (
    haystack.includes("1st attempt failed") ||
    haystack.includes("first attempt failed") ||
    haystack.includes("payment link") ||
    haystack.includes("secure link")
  ) {
    return "first";
  }
  return undefined;
}

function dedupeThreadIdsFromHistory(history: Awaited<ReturnType<typeof listGmailHistory>>): string[] {
  const ids = new Set<string>();

  for (const entry of history.history ?? []) {
    for (const collection of [
      entry.messagesAdded ?? [],
      entry.messagesDeleted ?? [],
      entry.labelsAdded ?? [],
      entry.labelsRemoved ?? [],
    ]) {
      for (const item of collection) {
        const threadId = item.message?.threadId?.trim();
        if (threadId) {
          ids.add(threadId);
        }
      }
    }
  }

  return Array.from(ids);
}

function buildThreadMetadata(
  existing: SyncThreadMetadata,
  thread: ParsedGmailThread,
  latestInbound: ParsedGmailThreadMessage,
  mode: SyncMode,
  admission?: AdmissionDecision,
  extras?: Partial<SyncThreadMetadata>,
): SyncThreadMetadata {
  return {
    ...existing,
    gmailHistoryId: thread.historyId,
    latestInboundMessageId: latestInbound.id,
    latestInboundAt: latestInbound.receivedAt,
    latestInboundSender: latestInbound.from,
    latestAdmissionDecision: admission?.outcome ?? existing.latestAdmissionDecision ?? null,
    latestAdmissionReason: admission?.reason ?? existing.latestAdmissionReason ?? null,
    lastProcessedAt: nowIso(),
    lastSyncMode: mode,
    ...extras,
  };
}

type UpsertSyncDraftResult = {
  draftId: string;
  draftIsNew: boolean;
  draftTemplateSubject: string | null;
  draftQualityPassed: boolean;
};

/**
 * Draft dedup guard for the sync pipeline.
 * - If a `generated` draft already exists, update it with new content.
 * - If an `edited`/`approved` draft exists, skip (operator already acted).
 * - Otherwise (no draft or only `sent` drafts), create a new one.
 */
async function upsertSyncDraft(
  threadId: string,
  draftPayload: {
    plainText: string;
    html: string | null;
    templateUsed: string | null;
    quality: Record<string, unknown>;
    interpret: Record<string, unknown> | undefined;
  },
  latestInbound: ParsedGmailThreadMessage,
  existingMetadata: SyncThreadMetadata,
  actorUid: string | null,
  db: D1Database,
): Promise<UpsertSyncDraftResult> {
  const threadRecord = await getThread(threadId, db);
  const existingPendingDraft = threadRecord ? getPendingDraft(threadRecord) : null;
  const existingCurrentDraft = threadRecord ? getCurrentDraft(threadRecord) : null;
  const existingDraftStatus = existingCurrentDraft?.status;

  if (existingPendingDraft) {
    // Update the existing generated draft with new content
    const updatedDraft = await updateDraft(
      {
        draftId: existingPendingDraft.id,
        status: "generated",
        subject: ensureReplySubject(latestInbound.subject),
        recipientEmails: buildDraftRecipients(latestInbound),
        plainText: draftPayload.plainText,
        html: draftPayload.html,
        templateUsed: draftPayload.templateUsed,
        quality: draftPayload.quality,
        interpret: draftPayload.interpret,
        createdByUid: actorUid,
      },
      db,
    );
    return {
      draftId: updatedDraft?.id ?? existingPendingDraft.id,
      draftIsNew: true,
      draftTemplateSubject: draftPayload.templateUsed,
      draftQualityPassed: true,
    };
  }

  if (existingDraftStatus === "edited" || existingDraftStatus === "approved") {
    // Operator has already acted — preserve their draft, skip new generation.
    return {
      draftId: existingCurrentDraft!.id,
      draftIsNew: false,
      draftTemplateSubject: existingMetadata.lastDraftTemplateSubject ?? null,
      draftQualityPassed: existingMetadata.lastDraftQualityPassed ?? false,
    };
  }

  // No relevant draft exists (or only sent drafts) — atomically create a new
  // one, guarded against concurrent sync runs that both reach this point.
  const atomicResult = await createDraftIfNotExists(
    {
      threadId,
      status: "generated",
      subject: ensureReplySubject(latestInbound.subject),
      recipientEmails: buildDraftRecipients(latestInbound),
      plainText: draftPayload.plainText,
      html: draftPayload.html,
      templateUsed: draftPayload.templateUsed,
      quality: draftPayload.quality,
      interpret: draftPayload.interpret,
      createdByUid: actorUid,
    },
    db,
  );
  return {
    draftId: atomicResult.draft.id,
    draftIsNew: atomicResult.created,
    draftTemplateSubject: draftPayload.templateUsed,
    draftQualityPassed: true,
  };
}

function determineThreadStatus(
  admission: AdmissionDecision,
  draftCreated: boolean,
  needsManualDraft: boolean,
): InboxThreadStatus {
  if (admission.outcome === "auto-archive") {
    return "auto_archived";
  }
  if (admission.outcome === "review-later") {
    return "review_later";
  }
  if (draftCreated && !needsManualDraft) {
    return "drafted";
  }
  return "pending";
}

function buildThreadUpsertStatement(
  db: D1Database,
  input: {
    id: string;
    status: InboxThreadStatus;
    subject: string | null;
    snippet: string | null;
    latestMessageAt: string | null;
    lastSyncedAt: string;
    metadataJson: string | null;
    metadata: SyncThreadMetadata;
  },
): D1PreparedStatement {
  const timestamp = nowIso();
  const m = input.metadata;
  return db
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        subject = excluded.subject,
        snippet = excluded.snippet,
        latest_message_at = excluded.latest_message_at,
        last_synced_at = excluded.last_synced_at,
        metadata_json = excluded.metadata_json,
        latest_inbound_message_id = excluded.latest_inbound_message_id,
        latest_inbound_at = excluded.latest_inbound_at,
        latest_inbound_sender = excluded.latest_inbound_sender,
        latest_admission_decision = excluded.latest_admission_decision,
        latest_admission_reason = excluded.latest_admission_reason,
        needs_manual_draft = excluded.needs_manual_draft,
        draft_failure_code = excluded.draft_failure_code,
        draft_failure_message = excluded.draft_failure_message,
        last_processed_at = excluded.last_processed_at,
        last_draft_id = excluded.last_draft_id,
        last_draft_template_subject = excluded.last_draft_template_subject,
        last_draft_quality_passed = excluded.last_draft_quality_passed,
        guest_booking_ref = excluded.guest_booking_ref,
        guest_occupant_id = excluded.guest_occupant_id,
        guest_first_name = excluded.guest_first_name,
        guest_last_name = excluded.guest_last_name,
        guest_check_in = excluded.guest_check_in,
        guest_check_out = excluded.guest_check_out,
        guest_room_numbers_json = excluded.guest_room_numbers_json,
        recovery_attempts = excluded.recovery_attempts,
        updated_at = excluded.updated_at
      `,
    )
    .bind(
      input.id,
      input.status,
      input.subject,
      input.snippet,
      null,
      input.latestMessageAt,
      input.lastSyncedAt,
      input.metadataJson,
      m.latestInboundMessageId ?? null,
      m.latestInboundAt ?? null,
      m.latestInboundSender ?? null,
      m.latestAdmissionDecision ?? null,
      m.latestAdmissionReason ?? null,
      m.needsManualDraft == null ? null : m.needsManualDraft ? 1 : 0,
      m.draftFailureCode ?? null,
      m.draftFailureMessage ?? null,
      m.lastProcessedAt ?? null,
      m.lastDraftId ?? null,
      m.lastDraftTemplateSubject ?? null,
      m.lastDraftQualityPassed == null ? null : m.lastDraftQualityPassed ? 1 : 0,
      m.guestBookingRef ?? null,
      m.guestOccupantId ?? null,
      m.guestFirstName ?? null,
      m.guestLastName ?? null,
      m.guestCheckIn ?? null,
      m.guestCheckOut ?? null,
      m.guestRoomNumbers ? JSON.stringify(m.guestRoomNumbers) : null,
      m.recoveryAttempts ?? null,
      timestamp,
      timestamp,
    );
}

function buildMessageUpsertStatements(
  db: D1Database,
  threadId: string,
  messages: ParsedGmailThreadMessage[],
  mailboxEmail: string,
): D1PreparedStatement[] {
  return messages.map((message) =>
    db
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
        ON CONFLICT(id) DO UPDATE SET
          thread_id = excluded.thread_id,
          direction = excluded.direction,
          sender_email = excluded.sender_email,
          recipient_emails_json = excluded.recipient_emails_json,
          subject = excluded.subject,
          snippet = excluded.snippet,
          sent_at = excluded.sent_at,
          payload_json = excluded.payload_json
        `,
      )
      .bind(
        message.id,
        threadId,
        isInboundMessage(message, mailboxEmail) ? "inbound" : "outbound",
        extractEmailAddress(message.from),
        JSON.stringify(message.to),
        message.subject,
        message.snippet,
        message.receivedAt,
        JSON.stringify({
          labelIds: message.labelIds,
          historyId: message.historyId,
          from: message.from,
          to: message.to,
          inReplyTo: message.inReplyTo,
          references: message.references,
          body: message.body,
          attachments: message.attachments,
        }),
        nowIso(),
      ),
  );
}

async function upsertThreadAndMessages(
  db: D1Database,
  thread: ParsedGmailThread,
  mailboxEmail: string,
  status: InboxThreadStatus,
  metadata: SyncThreadMetadata,
): Promise<{ threadUpserted: number; messagesUpserted: number }> {
  const latestMessage = [...thread.messages].sort(compareMessagesByDate).at(-1) ?? null;
  const statements = [
    buildThreadUpsertStatement(db, {
      id: thread.id,
      status,
      subject: latestMessage?.subject ?? null,
      snippet: latestMessage?.snippet ?? thread.snippet ?? null,
      latestMessageAt: latestMessage?.receivedAt ?? null,
      lastSyncedAt: nowIso(),
      metadataJson: JSON.stringify(metadata),
      metadata,
    }),
    ...buildMessageUpsertStatements(db, thread.id, thread.messages, mailboxEmail),
  ];

  await db.batch(statements);

  return {
    threadUpserted: 1,
    messagesUpserted: thread.messages.length,
  };
}

async function listThreadIdsForRescan(rescanWindowDays: number): Promise<string[]> {
  const ids = new Set<string>();
  let pageToken: string | undefined;

  do {
    const page = await listGmailThreads({
      maxResults: THREAD_PAGE_SIZE,
      query: `newer_than:${rescanWindowDays}d`,
      pageToken,
    });
    for (const thread of page.threads ?? []) {
      const threadId = thread.id?.trim();
      if (threadId) {
        ids.add(threadId);
      }
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  return Array.from(ids);
}

function isStaleHistoryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes(STALE_HISTORY_ERROR);
}


type SyncStep = "gmail_fetch" | "admission_classify" | "guest_match" | "draft_generate" | "db_write";

class SyncStepError extends Error {
  readonly step: SyncStep;
  constructor(step: SyncStep, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(message);
    this.name = "SyncStepError";
    this.step = step;
    this.cause = cause;
  }
}

type ProcessThreadContext = {
  db: D1Database;
  mailboxEmail: string;
  mode: SyncMode;
  guestEmailMap: GuestEmailMap;
  guestMapResult: GuestEmailMapResult;
  actorUid: string | null | undefined;
  counts: SyncInboxResult["counts"];
  isFirstGuestMatchEvent: { value: boolean };
};

/**
 * Process a single thread within a sync batch. Extracted from the syncInbox loop
 * to keep syncInbox under the eslint cyclomatic complexity limit.
 */
async function processThread(
  threadId: string,
  ctx: ProcessThreadContext,
): Promise<void> {
  const { db, mailboxEmail, mode, guestEmailMap, guestMapResult, actorUid, counts } = ctx;

  let step: SyncStep = "gmail_fetch";
  try {
  const gmailThread = await getGmailThread(threadId);
  counts.threadsFetched += 1;

  const latestInbound = getLatestInboundMessage(gmailThread, mailboxEmail);
  if (!latestInbound) {
    return;
  }

  step = "admission_classify";
  const existingRecord = await getThread(threadId, db);
  const existingMetadata = parseMetadata(existingRecord?.thread.metadata_json);
  const latestInboundUnchanged =
    existingMetadata.latestInboundMessageId === latestInbound.id;

  const existingStatus = existingRecord?.thread.status;
  const preservedStatus = latestInboundUnchanged && existingStatus ? existingStatus : "pending";

  if (latestInboundUnchanged) {
    const persisted = await upsertThreadAndMessages(
      db,
      gmailThread,
      mailboxEmail,
      preservedStatus,
      buildThreadMetadata(existingMetadata, gmailThread, latestInbound, mode),
    );
    counts.threadsUpserted += persisted.threadUpserted;
    counts.messagesUpserted += persisted.messagesUpserted;
    counts.skippedUnchanged += 1;
    return;
  }

  const admission = classifyForAdmission({
    fromRaw: latestInbound.from ?? undefined,
    subject: latestInbound.subject ?? undefined,
    snippet: latestInbound.snippet || latestInbound.body.plain,
  });

  step = "guest_match";
  // Match sender email to guest booking
  const senderEmail = extractEmailAddress(latestInbound.from);
  const guestMatch = senderEmail ? matchSenderToGuest(guestEmailMap, senderEmail) : null;

  // Emit guest match telemetry (best-effort)
  if (senderEmail) {
    const matchMetadata: Record<string, unknown> = guestMatch
      ? { bookingRef: guestMatch.bookingRef, senderEmail, guestName: guestMatch.firstName }
      : { senderEmail };

    // Attach batch-level map build metadata to the first match event
    if (ctx.isFirstGuestMatchEvent.value) {
      matchMetadata.mapBuildStatus = guestMapResult.status;
      matchMetadata.mapSize = guestMapResult.guestCount;
      matchMetadata.mapBuildDurationMs = guestMapResult.durationMs;
      if (guestMapResult.error) {
        matchMetadata.mapBuildError = guestMapResult.error;
      }
      ctx.isFirstGuestMatchEvent.value = false;
    }

    await recordInboxEvent({
      threadId,
      eventType: guestMatch ? "guest_matched" : "guest_match_not_found",
      actorUid: actorUid ?? null,
      metadata: matchMetadata,
    });
  }

  let draftCreated = false;
  let needsManualDraft = false;
  let draftId: string | null = null;
  let draftTemplateSubject: string | null = null;
  let draftQualityPassed = false;
  let draftFailureCode: string | null = null;
  let draftFailureMessage: string | null = null;
  let draftFailureChecks: string[] | null = null;
  let draftPayload:
    | {
        plainText: string;
        html: string | null;
        templateUsed: string | null;
        quality: Record<string, unknown>;
        interpret: Record<string, unknown> | undefined;
      }
    | null = null;

  if (admission.outcome === "admit") {
    step = "draft_generate";
    const draftResult = await generateAgentDraft({
      from: latestInbound.from ?? undefined,
      subject: latestInbound.subject ?? undefined,
      body: latestInbound.body.plain,
      threadContext: {
        ...buildThreadContext(gmailThread),
        ...(guestMatch?.bookingRef ? { bookingRef: guestMatch.bookingRef } : {}),
      },
      bookingRef: guestMatch?.bookingRef,
      prepaymentProvider: inferProviderFromBookingRef(guestMatch?.bookingRef) ?? inferPrepaymentProvider(latestInbound),
      prepaymentStep: inferPrepaymentStep(latestInbound),
      guestName: guestMatch?.firstName || undefined,
      guestRoomNumbers: guestMatch?.roomNumbers?.length ? guestMatch.roomNumbers : undefined,
    });

    if (draftResult.status !== "error" && draftResult.qualityResult?.passed) {
      draftCreated = true;
      draftPayload = {
        plainText: draftResult.plainText ?? "",
        html: draftResult.html,
        templateUsed: draftResult.templateUsed?.subject ?? null,
        quality: {
          ...(draftResult.qualityResult as Record<string, unknown>),
          deliveryStatus: draftResult.status,
        },
        interpret: draftResult.interpretResult as Record<string, unknown> | undefined,
      };
      draftTemplateSubject = draftResult.templateUsed?.subject ?? null;
      draftQualityPassed = true;
    } else {
      needsManualDraft = true;
      const failureReason = deriveDraftFailureReason(draftResult);
      draftFailureCode = failureReason.code;
      draftFailureMessage = failureReason.message;
      draftFailureChecks = failureReason.failed_checks ?? null;
      counts.manualDraftFlags += 1;
    }
  }

  step = "db_write";
  const nextStatus = determineThreadStatus(admission, draftCreated, needsManualDraft);
  const metadata = buildThreadMetadata(existingMetadata, gmailThread, latestInbound, mode, admission, {
    needsManualDraft,
    draftFailureCode,
    draftFailureMessage,
    draftFailureChecks,
    lastDraftTemplateSubject: draftTemplateSubject,
    lastDraftQualityPassed: draftQualityPassed,
    ...(guestMatch ? {
      guestBookingRef: guestMatch.bookingRef,
      guestOccupantId: guestMatch.occupantId,
      guestFirstName: guestMatch.firstName,
      guestLastName: guestMatch.lastName,
      guestCheckIn: guestMatch.checkInDate,
      guestCheckOut: guestMatch.checkOutDate,
      guestRoomNumbers: guestMatch.roomNumbers,
    } : {}),
  });
  const persisted = await upsertThreadAndMessages(db, gmailThread, mailboxEmail, nextStatus, metadata);
  counts.threadsUpserted += persisted.threadUpserted;
  counts.messagesUpserted += persisted.messagesUpserted;

  let draftIsNew = false;
  if (draftPayload) {
    const upsertResult = await upsertSyncDraft(
      threadId,
      draftPayload,
      latestInbound,
      existingMetadata,
      actorUid ?? null,
      db,
    );
    draftId = upsertResult.draftId;
    draftIsNew = upsertResult.draftIsNew;
    draftTemplateSubject = upsertResult.draftTemplateSubject;
    draftQualityPassed = upsertResult.draftQualityPassed;

    await updateThreadStatus(
      {
        threadId,
        status: nextStatus,
        latestMessageAt:
          [...gmailThread.messages].sort(compareMessagesByDate).at(-1)?.receivedAt ?? null,
        lastSyncedAt: nowIso(),
        metadata: {
          ...metadata,
          lastDraftId: draftId,
        },
      },
      db,
    );
  }

  await recordAdmission(
    {
      threadId,
      decision: admission.outcome,
      source: "reception_sync",
      classifierVersion: "reception-admission-v1",
      matchedRule: admission.reason,
      sourceMetadata: {
        organizeDecision: admission.organizeDecision,
        senderEmail: admission.senderEmail,
        latestInboundMessageId: latestInbound.id,
        syncMode: mode,
      },
    },
    db,
  );

  await recordInboxEvent({
    threadId,
    eventType:
      admission.outcome === "admit"
        ? "admitted"
        : admission.outcome === "auto-archive"
          ? "auto_archived"
          : "review_later",
    actorUid: actorUid ?? null,
    metadata: {
      reason: admission.reason,
      latestInboundMessageId: latestInbound.id,
      syncMode: mode,
    },
  });

  if (draftCreated && draftIsNew) {
    await recordInboxEvent({
      threadId,
      eventType: "drafted",
      actorUid: actorUid ?? null,
      metadata: {
        latestInboundMessageId: latestInbound.id,
        draftId,
        templateUsed: draftTemplateSubject,
        followUpRequired: draftPayload?.quality?.deliveryStatus === "needs_follow_up",
      },
    });
    counts.draftsCreated += 1;
  }

  if (admission.outcome === "admit") {
    counts.admitted += 1;
  } else if (admission.outcome === "auto-archive") {
    counts.autoArchived += 1;
  } else {
    counts.reviewLater += 1;
  }
  } catch (error) {
    throw new SyncStepError(step, error);
  }
}

export async function syncInbox(
  input: SyncInboxInput = {},
): Promise<SyncInboxResult> {
  const mailboxKey = input.mailboxKey ?? DEFAULT_MAILBOX_KEY;
  const rescanWindowDays = input.rescanWindowDays ?? DEFAULT_RESCAN_WINDOW_DAYS;
  const db = await getInboxDb();
  const checkpoint = await getInboxSyncCheckpoint(mailboxKey, db);
  const profile = await getGmailProfile();
  const mailboxEmail = profile.emailAddress.toLowerCase();
  const previousHistoryId = checkpoint?.lastHistoryId ?? null;

  let mode: SyncMode = previousHistoryId ? "incremental" : "initial_rescan";
  let historyRecords = 0;
  let threadIds: string[] = [];

  if (previousHistoryId) {
    try {
      let pageToken: string | undefined;
      const threadIdSet = new Set<string>();
      do {
        const page = await listGmailHistory({
          startHistoryId: previousHistoryId,
          maxResults: HISTORY_PAGE_SIZE,
          pageToken,
        });
        historyRecords += page.history?.length ?? 0;
        for (const threadId of dedupeThreadIdsFromHistory(page)) {
          threadIdSet.add(threadId);
        }
        pageToken = page.nextPageToken;
      } while (pageToken);
      threadIds = Array.from(threadIdSet);
    } catch (error) {
      if (!isStaleHistoryError(error)) {
        throw error;
      }
      mode = "bounded_rescan";
      threadIds = await listThreadIdsForRescan(rescanWindowDays);
    }
  } else {
    threadIds = await listThreadIdsForRescan(rescanWindowDays);
  }

  const counts: SyncInboxResult["counts"] = {
    historyRecords,
    threadsFetched: 0,
    threadsUpserted: 0,
    messagesUpserted: 0,
    admitted: 0,
    autoArchived: 0,
    reviewLater: 0,
    draftsCreated: 0,
    manualDraftFlags: 0,
    skippedUnchanged: 0,
    threadErrors: 0,
  };

  let hasErrors = false;

  // Build guest email map once per sync batch for guest-booking matching
  const guestMapResult: GuestEmailMapResult = await buildGuestEmailMap();
  const guestEmailMap = guestMapResult.map;
  const isFirstGuestMatchEvent = { value: true };

  const threadCtx: ProcessThreadContext = {
    db,
    mailboxEmail,
    mode,
    guestEmailMap,
    guestMapResult,
    actorUid: input.actorUid,
    counts,
    isFirstGuestMatchEvent,
  };

  for (const threadId of threadIds) {
    try {
      await processThread(threadId, threadCtx);
    } catch (threadError) {
      hasErrors = true;
      counts.threadErrors += 1;
      const failedStep = threadError instanceof SyncStepError ? threadError.step : "unknown";
      console.error("Sync error for thread", {
        threadId,
        step: failedStep,
        error: threadError instanceof Error ? threadError.message : String(threadError),
      });

      // Best-effort telemetry — must not mask the original error
      try {
        await recordInboxEvent({
          threadId,
          eventType: "thread_sync_error",
          metadata: {
            step: failedStep,
            error: threadError instanceof Error ? threadError.message : String(threadError),
            syncMode: mode,
          },
        });
      } catch {
        // Swallow telemetry failure to avoid masking the original thread error
      }
    }
  }

  // Fallback: log batch map build outcome when no per-thread match events were emitted
  if (isFirstGuestMatchEvent.value) {
    console.log("[guest-matcher-telemetry]", JSON.stringify({
      mapBuildStatus: guestMapResult.status,
      mapSize: guestMapResult.guestCount,
      mapBuildDurationMs: guestMapResult.durationMs,
      mapBuildError: guestMapResult.error ?? null,
      threadsProcessed: counts.threadsFetched,
      pipeline: "sync",
      reason: "no_match_events_emitted",
    }));
  }

  const finalProfile = await getGmailProfile();

  // All-or-nothing checkpoint: only advance if every thread succeeded
  if (!hasErrors) {
    await upsertInboxSyncCheckpoint(
      {
        mailboxKey,
        lastHistoryId: finalProfile.historyId,
        lastSyncedAt: nowIso(),
        metadata: {
          mode,
          rescanWindowDays,
          threadsFetched: counts.threadsFetched,
          historyRecords: counts.historyRecords,
        },
      },
      db,
    );
  }

  return {
    mailboxKey,
    mode,
    checkpointAdvanced: !hasErrors,
    checkpoint: {
      previousHistoryId,
      nextHistoryId: finalProfile.historyId,
    },
    counts,
  };
}
