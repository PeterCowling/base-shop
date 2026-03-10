import "server-only";

import type { D1Database } from "@acme/platform-core/d1";

import { getGmailProfile, getGmailThread } from "../gmail-client";

import { deriveDraftFailureReason, draftFailureReasonFromCode, generateAgentDraft } from "./draft-pipeline.server";
import {
  buildGuestEmailMap,
  type GuestEmailMapResult,
  matchSenderToGuest,
} from "./guest-matcher.server";
import {
  createDraft,
  findStaleAdmittedThreads,
  type InboxThreadRow,
  updateThreadStatus,
} from "./repositories.server";
import {
  buildThreadContext,
  extractEmailAddress,
  getLatestInboundMessage,
  inferPrepaymentProvider,
  inferPrepaymentStep,
} from "./sync.server";
import { recordInboxEvent } from "./telemetry.server";

const DEFAULT_MAX_RETRIES = 3;

export type RecoverStaleThreadsInput = {
  db: D1Database;
  staleThresholdMs: number;
  limit?: number;
  maxRetries?: number;
};

export type RecoverStaleThreadsResult = {
  processed: number;
  recovered: number;
  manualFlagged: number;
  skipped: number;
};

type ThreadMetadata = Record<string, unknown> & {
  needsManualDraft?: boolean;
  recoveryAttempts?: number;
};

function parseMetadata(raw: string | null | undefined): ThreadMetadata {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as ThreadMetadata) : {};
  } catch {
    return {};
  }
}

export async function recoverStaleThreads(
  input: RecoverStaleThreadsInput,
): Promise<RecoverStaleThreadsResult> {
  const { db, staleThresholdMs, limit, maxRetries = DEFAULT_MAX_RETRIES } = input;
  const result: RecoverStaleThreadsResult = {
    processed: 0,
    recovered: 0,
    manualFlagged: 0,
    skipped: 0,
  };

  const staleThreads = await findStaleAdmittedThreads(db, staleThresholdMs, limit);
  if (staleThreads.length === 0) {
    return result;
  }

  // Build guest email map once for all recovery threads
  const guestMapResult: GuestEmailMapResult = await buildGuestEmailMap();
  const guestEmailMap = guestMapResult.map;
  let isFirstGuestMatchEvent = true;

  // Get mailbox email for inbound message detection
  const profile = await getGmailProfile();
  const mailboxEmail = profile.emailAddress.toLowerCase();

  for (const thread of staleThreads) {
    result.processed += 1;

    try {
      const matchEventEmitted = await recoverSingleThread(thread, db, mailboxEmail, guestEmailMap, guestMapResult, isFirstGuestMatchEvent, maxRetries, result);
      if (matchEventEmitted) {
        isFirstGuestMatchEvent = false;
      }
    } catch (error) {
      // Fail-open: log and continue with next thread
      console.error("Recovery error for thread", {
        threadId: thread.id,
        error: error instanceof Error ? error.message : String(error),
      });
      result.skipped += 1;

      try {
        await recordInboxEvent({
          threadId: thread.id,
          eventType: "inbox_recovery",
          metadata: { outcome: "error", error: error instanceof Error ? error.message : String(error) },
        });
      } catch {
        // Best-effort telemetry
      }
    }
  }

  // Fallback: log batch map build outcome when no per-thread match events were emitted
  if (isFirstGuestMatchEvent) {
    console.log("[guest-matcher-telemetry]", JSON.stringify({
      mapBuildStatus: guestMapResult.status,
      mapSize: guestMapResult.guestCount,
      mapBuildDurationMs: guestMapResult.durationMs,
      mapBuildError: guestMapResult.error ?? null,
      threadsProcessed: result.processed,
      pipeline: "recovery",
      reason: "no_match_events_emitted",
    }));
  }

  return result;
}

/** Returns true if a guest match event was emitted during this thread's recovery. */
async function recoverSingleThread(
  thread: InboxThreadRow,
  db: D1Database,
  mailboxEmail: string,
  guestEmailMap: Awaited<ReturnType<typeof buildGuestEmailMap>>["map"],
  guestMapResult: GuestEmailMapResult,
  isFirstGuestMatchEvent: boolean,
  maxRetries: number,
  result: RecoverStaleThreadsResult,
): Promise<boolean> {
  const existingMetadata = parseMetadata(thread.metadata_json);
  const attempts = existingMetadata.recoveryAttempts ?? 0;

  // Check max retries -- if at max, flag for manual drafting immediately
  if (attempts >= maxRetries) {
    const reason = draftFailureReasonFromCode("max_retries_exceeded");
    await flagForManualDraft(thread, db, existingMetadata, "max_retries", reason.code, reason.message);
    result.manualFlagged += 1;
    return false;
  }

  // Fetch Gmail thread data
  let gmailThread;
  try {
    gmailThread = await getGmailThread(thread.id);
  } catch {
    // Gmail thread not found or API error -- skip gracefully
    result.skipped += 1;
    await recordInboxEvent({
      threadId: thread.id,
      eventType: "inbox_recovery",
      metadata: { outcome: "skipped", reason: "gmail_thread_not_found" },
    });
    return false;
  }

  if (!gmailThread) {
    result.skipped += 1;
    await recordInboxEvent({
      threadId: thread.id,
      eventType: "inbox_recovery",
      metadata: { outcome: "skipped", reason: "gmail_thread_null" },
    });
    return false;
  }

  // Extract latest inbound message
  const latestInbound = getLatestInboundMessage(gmailThread, mailboxEmail);
  if (!latestInbound) {
    result.skipped += 1;
    await recordInboxEvent({
      threadId: thread.id,
      eventType: "inbox_recovery",
      metadata: { outcome: "skipped", reason: "no_inbound_message" },
    });
    return false;
  }

  // Increment recovery attempts in metadata before attempting draft
  const updatedAttempts = attempts + 1;

  // Run guest matching
  const senderEmail = extractEmailAddress(latestInbound.from);
  const guestMatch = senderEmail ? matchSenderToGuest(guestEmailMap, senderEmail) : null;

  // Emit guest match telemetry (best-effort)
  let matchEventEmitted = false;
  if (senderEmail) {
    const matchMetadata: Record<string, unknown> = guestMatch
      ? { bookingRef: guestMatch.bookingRef, senderEmail, guestName: guestMatch.firstName }
      : { senderEmail };

    // Attach batch-level map build metadata to the first match event
    if (isFirstGuestMatchEvent) {
      matchMetadata.mapBuildStatus = guestMapResult.status;
      matchMetadata.mapSize = guestMapResult.guestCount;
      matchMetadata.mapBuildDurationMs = guestMapResult.durationMs;
      if (guestMapResult.error) {
        matchMetadata.mapBuildError = guestMapResult.error;
      }
    }

    await recordInboxEvent({
      threadId: thread.id,
      eventType: guestMatch ? "guest_matched" : "guest_match_not_found",
      metadata: matchMetadata,
    });
    matchEventEmitted = true;
  }

  // Generate draft with full syncInbox context
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
    // Draft quality passed -- create draft and update thread status
    await createDraft(
      {
        threadId: thread.id,
        plainText: draftResult.plainText ?? "",
        html: draftResult.html,
        templateUsed: draftResult.templateUsed?.subject ?? null,
        quality: draftResult.qualityResult as Record<string, unknown>,
        interpret: draftResult.interpretResult as Record<string, unknown> | undefined,
        recipientEmails: latestInbound.from ? [latestInbound.from] : [],
        subject: latestInbound.subject ? `Re: ${latestInbound.subject.replace(/^Re:\s*/i, "")}` : "Re: Guest inquiry",
      },
      db,
    );

    await updateThreadStatus(
      {
        threadId: thread.id,
        status: "drafted",
        metadata: {
          ...existingMetadata,
          recoveryAttempts: updatedAttempts,
          needsManualDraft: false,
          draftFailureCode: null,
          draftFailureMessage: null,
          lastDraftTemplateSubject: draftResult.templateUsed?.subject ?? null,
          lastDraftQualityPassed: true,
          ...(guestMatch ? {
            guestBookingRef: guestMatch.bookingRef,
            guestOccupantId: guestMatch.occupantId,
            guestFirstName: guestMatch.firstName,
            guestLastName: guestMatch.lastName,
            guestCheckIn: guestMatch.checkInDate,
            guestCheckOut: guestMatch.checkOutDate,
            guestRoomNumbers: guestMatch.roomNumbers,
          } : {}),
        },
      },
      db,
    );

    await recordInboxEvent({
      threadId: thread.id,
      eventType: "inbox_recovery",
      metadata: { outcome: "recovered", attempt: updatedAttempts },
    });

    result.recovered += 1;
  } else {
    // Draft failed or quality failed -- flag for manual drafting
    const failureReason = deriveDraftFailureReason(draftResult);
    await flagForManualDraft(thread, db, {
      ...existingMetadata,
      recoveryAttempts: updatedAttempts,
    }, "manual_flagged", failureReason.code, failureReason.message);
    result.manualFlagged += 1;
  }

  return matchEventEmitted;
}

async function flagForManualDraft(
  thread: InboxThreadRow,
  db: D1Database,
  existingMetadata: ThreadMetadata,
  outcome: string,
  failureCode?: string,
  failureMessage?: string,
): Promise<void> {
  await updateThreadStatus(
    {
      threadId: thread.id,
      status: "pending",
      metadata: {
        ...existingMetadata,
        needsManualDraft: true,
        draftFailureCode: failureCode ?? null,
        draftFailureMessage: failureMessage ?? null,
      },
    },
    db,
  );

  await recordInboxEvent({
    threadId: thread.id,
    eventType: "inbox_recovery",
    metadata: { outcome, attempts: existingMetadata.recoveryAttempts ?? 0 },
  });
}
