/**
 * Gmail Organize Module
 *
 * Handles the gmail_organize_inbox tool which scans unread inbox emails,
 * trashes known garbage patterns, and labels customer emails for queue.
 */

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

import { withRetry } from "../utils/gmail-retry.js";
import { buildOrganizeQuery } from "../utils/organize-query.js";
import { errorResult, jsonResult } from "../utils/validation.js";

import {
  type BookingReservationSample,
  type DeferredSample,
  handleCancellationCase,
  processBookingReservationNotification,
} from "./gmail-booking.js";
import { classifyOrganizeDecision } from "./gmail-classify.js";
import {
  appendAuditEntry,
  collectLabelIds,
  type EmailHeader,
  ensureLabelMap,
  formatGmailQueryDate,
  getHeader,
  getLockStore,
  hasBriketteLabel,
  LABELS,
  LEGACY_LABELS,
  PROCESSING_TIMEOUT_MS,
  REQUIRED_LABELS,
  TERMINAL_LABELS,
} from "./gmail-shared.js";

// =============================================================================
// Schema
// =============================================================================

export const organizeInboxSchema = z.object({
  testMode: z.boolean().optional().default(false),
  specificStartDate: z.string().optional(),
  limit: z.number().min(1).max(500).optional().default(500),
  dryRun: z.boolean().optional().default(false),
});

// =============================================================================
// Startup Recovery
// =============================================================================

/**
 * Startup recovery: scan Gmail for In-Progress emails whose lock file is
 * absent or stale. Requeues them to Needs-Processing so they are not lost.
 * Called at the start of each handleOrganizeInbox run.
 */
async function runStartupRecovery(
  gmail: gmail_v1.Gmail,
  labelMap: Map<string, string>,
  needsProcessingLabelId: string,
  dryRun: boolean
): Promise<void> {
  const lockStoreRef = getLockStore();
  const processingLabelIds = collectLabelIds(labelMap, [
    LABELS.PROCESSING,
    LEGACY_LABELS.PROCESSING,
  ]);
  if (processingLabelIds.length === 0) return;

  const inProgressResponse = await gmail.users.messages.list({
    userId: "me",
    labelIds: processingLabelIds.slice(0, 1), // check first matching label only
    maxResults: 50,
  });
  const inProgressMessages = inProgressResponse.data.messages || [];
  for (const inProgressMsg of inProgressMessages) {
    if (!inProgressMsg.id) continue;
    const lockEntry = lockStoreRef.get(inProgressMsg.id);
    const isStale = lockEntry
      ? lockStoreRef.isStale(inProgressMsg.id, PROCESSING_TIMEOUT_MS)
      : true; // no lock file -> treat as stale (orphaned)
    if (isStale) {
      if (!dryRun) {
        await gmail.users.messages.modify({
          userId: "me",
          id: inProgressMsg.id,
          requestBody: {
            addLabelIds: [needsProcessingLabelId],
            removeLabelIds: processingLabelIds,
          },
        });
      }
      lockStoreRef.release(inProgressMsg.id);
      appendAuditEntry({
        ts: new Date().toISOString(),
        messageId: inProgressMsg.id,
        action: "lock-released",
        actor: "system",
        result: "startup-recovery",
      });
    }
  }
}

// =============================================================================
// Handler
// =============================================================================

export async function handleOrganizeInbox(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { testMode, specificStartDate, limit, dryRun } = organizeInboxSchema.parse(args);

  let startDateString: string | null = null;
  let tomorrowDateString: string | null = null;

  if (specificStartDate) {
    const parsed = new Date(specificStartDate);
    if (Number.isNaN(parsed.getTime())) {
      return errorResult(`Invalid specificStartDate: ${specificStartDate}`);
    }
    startDateString = formatGmailQueryDate(parsed);
    tomorrowDateString = formatGmailQueryDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  }

  // Transitional fix (TASK-06): label-absence query covers emails read before the bot runs.
  // Long-term: Gmail filter or users.history.list + lastHistoryId ingestion.
  // Validated via dryRun before live deployment (see TASK-08 decision log).
  const query = buildOrganizeQuery(
    TERMINAL_LABELS,
    "label-absence",
    startDateString ? { startDate: startDateString } : undefined,
  );

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const needsProcessingLabelId = labelMap.get(LABELS.NEEDS_PROCESSING);
  const promotionalLabelId = labelMap.get(LABELS.PROMOTIONAL);
  const spamLabelId = labelMap.get(LABELS.SPAM);
  const deferredLabelId = labelMap.get(LABELS.DEFERRED);
  if (!needsProcessingLabelId) {
    return errorResult(
      `Label "${LABELS.NEEDS_PROCESSING}" not found in Gmail. ` +
      `Please create the Brikette label hierarchy first.`
    );
  }

  const labelNameById = new Map<string, string>(
    Array.from(labelMap.entries()).map(([name, id]) => [id, name])
  );

  await runStartupRecovery(gmail, labelMap, needsProcessingLabelId, dryRun);

  const response = await withRetry(() =>
    gmail.users.threads.list({
      userId: "me",
      q: query,
      maxResults: limit,
    }),
  );

  const threads = response.data.threads || [];
  let scannedThreads = 0;
  let labeledNeedsProcessing = 0;
  let labeledPromotional = 0;
  let labeledSpam = 0;
  let labeledDeferred = 0;
  let processedBookingReservations = 0;
  let processedCancellations = 0;
  let trashed = 0;
  let skippedAlreadyManaged = 0;
  let skippedNoAction = 0;

  const samples = {
    labeled: [] as Array<{ threadId: string; messageId: string; subject: string; from: string }>,
    trashed: [] as Array<{ threadId: string; messageId: string; subject: string; from: string }>,
    promotional: [] as Array<{ threadId: string; messageId: string; subject: string; from: string }>,
    spam: [] as Array<{ threadId: string; messageId: string; subject: string; from: string }>,
    bookingReservations: [] as BookingReservationSample[],
    deferred: [] as DeferredSample[],
  };
  const processedDraftedLabelId = labelMap.get(LABELS.PROCESSED_DRAFTED);

  for (const thread of threads) {
    if (!thread.id) continue;
    scannedThreads += 1;

    const detail = await gmail.users.threads.get({
      userId: "me",
      id: thread.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date", "List-Unsubscribe", "List-Id", "Precedence"],
    });

    const messages = detail.data.messages || [];
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage?.id) continue;

    const latestHeaders = (latestMessage.payload?.headers || []) as EmailHeader[];
    const fromRaw = getHeader(latestHeaders, "From");
    const subject = getHeader(latestHeaders, "Subject") || "(no subject)";
    const snippet = latestMessage.snippet || "";
    const hasListUnsubscribeHeader = latestHeaders.some(
      header => header.name.toLowerCase() === "list-unsubscribe"
    );
    const hasListIdHeader = latestHeaders.some(
      header => header.name.toLowerCase() === "list-id"
    );
    const hasBulkPrecedenceHeader = latestHeaders.some(header => {
      return (
        header.name.toLowerCase() === "precedence" &&
        /(bulk|list|junk)/i.test(header.value || "")
      );
    });

    if (hasBriketteLabel(latestMessage.labelIds, labelNameById)) {
      skippedAlreadyManaged += 1;
      continue;
    }

    const classification = classifyOrganizeDecision(
      fromRaw,
      subject,
      snippet,
      hasListUnsubscribeHeader,
      hasListIdHeader,
      hasBulkPrecedenceHeader
    );

    switch (classification.decision) {
      case "trash": {
        trashed += 1;
        if (!dryRun) {
          const addLabelIds = ["TRASH"];
          if (spamLabelId) {
            addLabelIds.unshift(spamLabelId);
          }
          await gmail.users.messages.modify({
            userId: "me",
            id: latestMessage.id,
            requestBody: {
              addLabelIds,
              removeLabelIds: ["INBOX"],
            },
          });
        }
        if (samples.trashed.length < 10) {
          samples.trashed.push({
            threadId: thread.id,
            messageId: latestMessage.id,
            subject,
            from: fromRaw,
          });
        }
        break;
      }
      case "needs_processing": {
        labeledNeedsProcessing += 1;
        if (!dryRun) {
          await gmail.users.messages.modify({
            userId: "me",
            id: latestMessage.id,
            requestBody: {
              addLabelIds: [needsProcessingLabelId],
            },
          });
        }
        if (samples.labeled.length < 10) {
          samples.labeled.push({
            threadId: thread.id,
            messageId: latestMessage.id,
            subject,
            from: fromRaw,
          });
        }
        break;
      }
      case "booking_reservation": {
        const outcome = await processBookingReservationNotification({
          gmail,
          messageId: latestMessage.id,
          threadId: thread.id,
          subject,
          fromRaw,
          senderEmail: classification.senderEmail,
          dryRun,
          deferredLabelId,
          processedDraftedLabelId,
        });

        if (outcome.status === "deferred") {
          labeledDeferred += 1;
          if (samples.deferred.length < 20) {
            samples.deferred.push(outcome.sample);
          }
          break;
        }

        processedBookingReservations += 1;
        if (samples.bookingReservations.length < 20) {
          samples.bookingReservations.push(outcome.sample);
        }
        break;
      }
      case "cancellation": {
        const result = await handleCancellationCase({
          gmail,
          labelMap,
          latestMessage,
          dryRun,
          fromRaw,
        });
        if (result.processed) {
          processedCancellations += 1;
        }
        break;
      }
      case "promotional": {
        labeledPromotional += 1;
        if (!dryRun) {
          await gmail.users.messages.modify({
            userId: "me",
            id: latestMessage.id,
            requestBody: {
              addLabelIds: promotionalLabelId ? [promotionalLabelId] : [],
              removeLabelIds: ["INBOX"],
            },
          });
        }
        if (samples.promotional.length < 10) {
          samples.promotional.push({
            threadId: thread.id,
            messageId: latestMessage.id,
            subject,
            from: fromRaw,
          });
        }
        break;
      }
      case "spam": {
        labeledSpam += 1;
        if (!dryRun) {
          const addLabelIds = ["SPAM"];
          if (spamLabelId) {
            addLabelIds.unshift(spamLabelId);
          }
          await gmail.users.messages.modify({
            userId: "me",
            id: latestMessage.id,
            requestBody: {
              addLabelIds,
              removeLabelIds: ["INBOX"],
            },
          });
        }
        if (samples.spam.length < 10) {
          samples.spam.push({
            threadId: thread.id,
            messageId: latestMessage.id,
            subject,
            from: fromRaw,
          });
        }
        break;
      }
      case "deferred": {
        labeledDeferred += 1;
        if (!dryRun) {
          await gmail.users.messages.modify({
            userId: "me",
            id: latestMessage.id,
            requestBody: {
              addLabelIds: deferredLabelId ? [deferredLabelId] : [],
              removeLabelIds: ["INBOX"],
            },
          });
        }
        if (samples.deferred.length < 20) {
          samples.deferred.push({
            threadId: thread.id,
            messageId: latestMessage.id,
            subject,
            from: fromRaw,
            senderEmail: classification.senderEmail,
            reason: classification.reason,
          });
        }
        break;
      }
      default: {
        skippedNoAction += 1;
      }
    }
  }

  return jsonResult({
    success: true,
    dryRun,
    query,
    scanWindow: {
      startDate: startDateString,
      beforeDate: tomorrowDateString,
      testMode,
      specificStartDate: specificStartDate ?? null,
      mode: specificStartDate ? "from-date" : "label-absence",
    },
    counts: {
      scannedThreads,
      labeledNeedsProcessing,
      labeledPromotional,
      labeledSpam,
      labeledDeferred,
      processedBookingReservations,
      processedCancellations,
      routedBookingMonitor: 0,
      trashed,
      skippedAlreadyManaged,
      skippedNoAction,
    },
    samples,
    followUp: {
      deferredNeedsInstruction: samples.deferred.map(item => ({
        senderEmail: item.senderEmail,
        subject: item.subject,
        reason: item.reason,
        messageId: item.messageId,
      })),
    },
  });
}
