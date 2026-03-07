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
import { getCurrentDraft, getPendingDraft } from "./api-models.server";
import { getInboxDb } from "./db.server";
import { generateAgentDraft } from "./draft-pipeline.server";
import {
  buildGuestEmailMap,
  type GuestEmailMap,
  matchSenderToGuest,
} from "./guest-matcher.server";
import {
  createDraft,
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

const DEFAULT_MAILBOX_KEY = "primary";
const DEFAULT_RESCAN_WINDOW_DAYS = 30;
const HISTORY_PAGE_SIZE = 200;
const THREAD_PAGE_SIZE = 100;
const STALE_HISTORY_ERROR = "Requested entity was not found.";
type SyncMode = "incremental" | "initial_rescan" | "bounded_rescan";

type SyncThreadMetadata = {
  gmailHistoryId?: string | null;
  latestInboundMessageId?: string | null;
  latestInboundAt?: string | null;
  latestInboundSender?: string | null;
  latestAdmissionDecision?: AdmissionDecision["outcome"] | null;
  latestAdmissionReason?: string | null;
  needsManualDraft?: boolean;
  lastProcessedAt?: string | null;
  lastSyncMode?: SyncMode | null;
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
};

export type SyncInboxInput = {
  actorUid?: string | null;
  mailboxKey?: string;
  rescanWindowDays?: number;
};

export type SyncInboxResult = {
  mailboxKey: string;
  mode: SyncMode;
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
  } catch {
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

export function buildThreadContext(thread: ParsedGmailThread): { messages: Array<{ from: string; date: string; snippet: string }> } {
  return {
    messages: thread.messages.map((message) => ({
      from: message.from ?? "Unknown sender",
      date: message.receivedAt ?? message.internalDate ?? nowIso(),
      snippet: message.body.plain || message.snippet,
    })),
  };
}

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

  // No relevant draft exists (or only sent drafts) — create a new one
  const createdDraft = await createDraft(
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
    draftId: createdDraft.id,
    draftIsNew: true,
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
  },
): D1PreparedStatement {
  const timestamp = nowIso();
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
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        subject = excluded.subject,
        snippet = excluded.snippet,
        latest_message_at = excluded.latest_message_at,
        last_synced_at = excluded.last_synced_at,
        metadata_json = excluded.metadata_json,
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

export async function syncInbox(
  input: SyncInboxInput = {},
): Promise<SyncInboxResult> {
  const mailboxKey = input.mailboxKey ?? DEFAULT_MAILBOX_KEY;
  const rescanWindowDays = input.rescanWindowDays ?? DEFAULT_RESCAN_WINDOW_DAYS;
  const db = getInboxDb();
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
  };

  // Build guest email map once per sync batch for guest-booking matching
  let guestEmailMap: GuestEmailMap;
  try {
    guestEmailMap = await buildGuestEmailMap();
  } catch {
    guestEmailMap = new Map();
  }

  for (const threadId of threadIds) {
    const gmailThread = await getGmailThread(threadId);
    counts.threadsFetched += 1;

    const latestInbound = getLatestInboundMessage(gmailThread, mailboxEmail);
    if (!latestInbound) {
      continue;
    }

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
      continue;
    }

    const admission = classifyForAdmission({
      fromRaw: latestInbound.from ?? undefined,
      subject: latestInbound.subject ?? undefined,
      snippet: latestInbound.snippet || latestInbound.body.plain,
    });

    // Match sender email to guest booking
    const senderEmail = extractEmailAddress(latestInbound.from);
    const guestMatch = senderEmail ? matchSenderToGuest(guestEmailMap, senderEmail) : null;

    let draftCreated = false;
    let needsManualDraft = false;
    let draftId: string | null = null;
    let draftTemplateSubject: string | null = null;
    let draftQualityPassed = false;
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
      const draftResult = await generateAgentDraft({
        from: latestInbound.from ?? undefined,
        subject: latestInbound.subject ?? undefined,
        body: latestInbound.body.plain,
        threadContext: buildThreadContext(gmailThread),
        prepaymentProvider: inferPrepaymentProvider(latestInbound),
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
          quality: draftResult.qualityResult as Record<string, unknown>,
          interpret: draftResult.interpretResult as Record<string, unknown> | undefined,
        };
        draftTemplateSubject = draftResult.templateUsed?.subject ?? null;
        draftQualityPassed = true;
      } else {
        needsManualDraft = true;
        counts.manualDraftFlags += 1;
      }
    }

    const nextStatus = determineThreadStatus(admission, draftCreated, needsManualDraft);
    const metadata = buildThreadMetadata(existingMetadata, gmailThread, latestInbound, mode, admission, {
      needsManualDraft,
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
        input.actorUid ?? null,
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
      actorUid: input.actorUid ?? null,
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
        actorUid: input.actorUid ?? null,
        metadata: {
          latestInboundMessageId: latestInbound.id,
          draftId,
          templateUsed: draftTemplateSubject,
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
  }

  const finalProfile = await getGmailProfile();
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

  return {
    mailboxKey,
    mode,
    checkpoint: {
      previousHistoryId,
      nextHistoryId: finalProfile.historyId,
    },
    counts,
  };
}
