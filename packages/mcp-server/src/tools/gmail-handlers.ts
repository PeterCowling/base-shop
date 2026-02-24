/**
 * Gmail Tool Handlers
 *
 * Individual handler implementations for gmail_list_pending, gmail_list_query,
 * gmail_get_email, gmail_create_draft, gmail_mark_processed,
 * gmail_telemetry_daily_rollup, and gmail_migrate_labels.
 */

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

import { createRawEmail } from "../utils/email-mime.js";
import { errorResult, jsonResult } from "../utils/validation.js";
import {
  type PrepaymentProvider,
  prepaymentStepFromAction,
  resolvePrepaymentWorkflow,
} from "../utils/workflow-triggers.js";

import {
  actorToLabelName,
  appendAuditEntry,
  appendTelemetryEvent,
  cleanupInProgress,
  collectLabelIds,
  computeDailyTelemetryRollup,
  type EmailDetails,
  type EmailHeader,
  ensureLabelMap,
  extractAttachments,
  extractBody,
  getHeader,
  getLockStore,
  isPrepaymentAction,
  isProcessingLockStale,
  LABELS,
  LEGACY_LABELS,
  LEGACY_TO_CURRENT_LABEL_MAP,
  parseEmailAddress,
  type PendingEmail,
  readTelemetryEvents,
  REQUIRED_LABELS,
  resolveQueueStateFromLabels,
  resolveQueueTargetForAction,
} from "./gmail-shared.js";

// =============================================================================
// Zod Schemas
// =============================================================================

const listPendingSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(20),
});

const listQuerySchema = z.object({
  query: z.string().trim().min(1),
  limit: z.number().min(1).max(100).optional().default(50),
});

const getEmailSchema = z.object({
  emailId: z.string().min(1),
  includeThread: z.boolean().optional().default(true),
  actor: z.enum(["codex", "claude", "human"]).optional().default("codex"),
});

const createDraftSchema = z.object({
  emailId: z.string().min(1),
  subject: z.string().min(1),
  bodyPlain: z.string().min(1),
  bodyHtml: z.string().optional(),
});

export const markProcessedSchema = z.object({
  emailId: z.string().min(1),
  action: z.enum([
    "drafted",
    "skipped",
    "spam",
    "deferred",
    "requeued",
    "acknowledged",
    "promotional",
    "awaiting_agreement",
    "agreement_received",
    "prepayment_chase_1",
    "prepayment_chase_2",
    "prepayment_chase_3",
  ]),
  actor: z.enum(["codex", "claude", "human"]).optional().default("codex"),
  sourcePath: z
    .enum(["queue", "reception", "outbound", "unknown"])
    .optional()
    .default("queue"),
  prepaymentProvider: z.enum(["octorate", "hostelworld"]).optional(),
});

const telemetryDailyRollupSchema = z.object({
  startDate: z.string().optional(),
  days: z.number().int().min(1).max(90).optional().default(7),
});

const migrateLabelsSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  limitPerLabel: z.number().int().min(1).max(1000).optional().default(500),
});

// =============================================================================
// Handlers
// =============================================================================

export async function handleListPending(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { limit } = listPendingSchema.parse(args);

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const pendingLabelIds = collectLabelIds(labelMap, [
    LABELS.NEEDS_PROCESSING,
    LEGACY_LABELS.NEEDS_PROCESSING,
  ]);
  if (pendingLabelIds.length === 0) {
    return errorResult(
      `Label "${LABELS.NEEDS_PROCESSING}" not found in Gmail. ` +
      `Please create the Brikette label hierarchy first.`
    );
  }

  const messageMap = new Map<string, { id: string }>();
  let sawMaxPage = false;
  for (const labelId of pendingLabelIds) {
    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: [labelId],
      maxResults: limit,
    });
    const messages = response.data.messages || [];
    if (messages.length === limit) {
      sawMaxPage = true;
    }
    for (const message of messages) {
      if (!message.id || messageMap.has(message.id)) continue;
      messageMap.set(message.id, { id: message.id });
      if (messageMap.size >= limit) {
        break;
      }
    }
    if (messageMap.size >= limit) {
      break;
    }
  }

  const messages = Array.from(messageMap.values());
  const emails: PendingEmail[] = [];

  for (const msg of messages) {
    if (!msg.id) continue;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "metadata",
      metadataHeaders: ["From", "Subject", "Date"],
    });

    const headers = (detail.data.payload?.headers || []) as EmailHeader[];
    const from = parseEmailAddress(getHeader(headers, "From"));
    const subject = getHeader(headers, "Subject") || "(no subject)";
    const dateStr = getHeader(headers, "Date");

    const thread = await gmail.users.threads.get({
      userId: "me",
      id: detail.data.threadId || "",
      format: "minimal",
    });
    const isReply = (thread.data.messages?.length || 0) > 1;

    emails.push({
      id: msg.id,
      threadId: detail.data.threadId || "",
      from,
      subject,
      receivedAt: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
      snippet: detail.data.snippet || "",
      labels: detail.data.labelIds || [],
      isReply,
    });
  }

  return jsonResult({
    emails,
    total: emails.length,
    hasMore: sawMaxPage || messages.length === limit,
  });
}


export async function handleListQuery(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { query, limit } = listQuerySchema.parse(args);

  const response = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: limit,
  });

  const messages = response.data.messages || [];
  if (messages.length == 0) {
    return jsonResult({ emails: [] });
  }

  const emailDetails = await Promise.all(
    messages.map(async message => {
      if (!message.id) return null;
      try {
        const details = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "metadata",
          metadataHeaders: ["Subject", "From", "Date"],
        });

        const headers = (details.data.payload?.headers || []) as EmailHeader[];
        return {
          id: details.data.id,
          threadId: details.data.threadId,
          subject: getHeader(headers, "Subject"),
          from: getHeader(headers, "From"),
          date: getHeader(headers, "Date"),
          snippet: details.data.snippet || "",
        };
      } catch {
        return null;
      }
    })
  );

  return jsonResult({
    emails: emailDetails.filter((email): email is NonNullable<typeof email> => !!email),
    hasMore: messages.length === limit,
  });
}

export async function handleGetEmail(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { emailId, includeThread, actor } = getEmailSchema.parse(args);

  const response = await gmail.users.messages.get({
    userId: "me",
    id: emailId,
    format: "full",
  });

  const msg = response.data;
  if (!msg.id) {
    return errorResult(`Email not found: ${emailId}`);
  }

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const processingLabelIds = collectLabelIds(labelMap, [
    LABELS.PROCESSING,
    LEGACY_LABELS.PROCESSING,
  ]);
  const needsProcessingLabelIds = collectLabelIds(labelMap, [
    LABELS.NEEDS_PROCESSING,
    LEGACY_LABELS.NEEDS_PROCESSING,
  ]);
  const currentProcessingLabelId = labelMap.get(LABELS.PROCESSING);
  if (!currentProcessingLabelId) {
    return errorResult(`Label "${LABELS.PROCESSING}" not found in Gmail.`);
  }
  const agentLabelId = labelMap.get(actorToLabelName(actor));
  const allAgentLabelIds = collectLabelIds(labelMap, [
    LABELS.AGENT_CODEX,
    LABELS.AGENT_CLAUDE,
    LABELS.AGENT_HUMAN,
  ]);

  const lockStoreRef = getLockStore();
  const messageLabelIds = msg.labelIds || [];
  if (messageLabelIds.some(labelId => processingLabelIds.includes(labelId))) {
    const isStale = isProcessingLockStale(emailId);
    if (isStale) {
      await gmail.users.messages.modify({
        userId: "me",
        id: emailId,
        requestBody: {
          removeLabelIds: processingLabelIds,
        },
      });
      lockStoreRef.release(emailId);
      appendAuditEntry({ ts: new Date().toISOString(), messageId: emailId, action: "lock-released", actor: "system" });
    } else {
      return errorResult(`Email ${emailId} is already being processed.`);
    }
  }

  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: {
      addLabelIds: [
        currentProcessingLabelId,
        ...(agentLabelId ? [agentLabelId] : []),
      ],
      removeLabelIds: [
        ...needsProcessingLabelIds,
        ...allAgentLabelIds.filter(id => id !== agentLabelId),
      ],
    },
  });
  lockStoreRef.acquire(emailId, actor || "unknown");
  appendAuditEntry({ ts: new Date().toISOString(), messageId: emailId, action: "lock-acquired", actor });

  const headers = (msg.payload?.headers || []) as EmailHeader[];
  const from = parseEmailAddress(getHeader(headers, "From"));
  const subject = getHeader(headers, "Subject") || "(no subject)";
  const dateStr = getHeader(headers, "Date");
  const messageId = getHeader(headers, "Message-ID");

  const body = extractBody(msg.payload as Parameters<typeof extractBody>[0]);
  const attachments = extractAttachments(msg.payload as Parameters<typeof extractAttachments>[0]);

  let threadContext: EmailDetails["threadContext"];
  if (includeThread && msg.threadId) {
    const thread = await gmail.users.threads.get({
      userId: "me",
      id: msg.threadId,
      format: "metadata",
      metadataHeaders: ["From", "Date"],
    });

    const messages = thread.data.messages || [];
    if (messages.length > 1) {
      threadContext = {
        messages: messages
          .filter(m => m.id !== emailId)
          .map(m => {
            const msgHeaders = (m.payload?.headers || []) as EmailHeader[];
            return {
              from: getHeader(msgHeaders, "From"),
              date: getHeader(msgHeaders, "Date"),
              snippet: m.snippet || "",
            };
          }),
      };
    }
  }

  const emailDetails: EmailDetails = {
    id: msg.id,
    threadId: msg.threadId || "",
    from,
    subject,
    receivedAt: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
    snippet: msg.snippet || "",
    labels: msg.labelIds || [],
    isReply: !!threadContext,
    body,
    attachments,
    threadContext,
  };

  return jsonResult({
    ...emailDetails,
    messageId,
  });
}

export async function handleCreateDraft(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult>> {
  const { emailId, subject, bodyPlain, bodyHtml } = createDraftSchema.parse(args);

  const original = await gmail.users.messages.get({
    userId: "me",
    id: emailId,
    format: "metadata",
    metadataHeaders: ["From", "Message-ID", "References"],
  });

  const headers = (original.data.payload?.headers || []) as EmailHeader[];
  const from = getHeader(headers, "From");
  const messageId = getHeader(headers, "Message-ID");
  const existingRefs = getHeader(headers, "References");

  const references = existingRefs
    ? `${existingRefs} ${messageId}`
    : messageId;

  const raw = createRawEmail(
    from,
    subject,
    bodyPlain,
    bodyHtml,
    messageId,
    references
  );

  const draft = await gmail.users.drafts.create({
    userId: "me",
    requestBody: {
      message: {
        raw,
        threadId: original.data.threadId,
      },
    },
  });

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const reviewLabelId = labelMap.get(LABELS.READY_FOR_REVIEW);
  if (reviewLabelId && draft.data.message?.id) {
    try {
      await gmail.users.messages.modify({
        userId: "me",
        id: draft.data.message.id,
        requestBody: {
          addLabelIds: [reviewLabelId],
        },
      });
    } catch {
      // Label might not exist, continue anyway
    }
  }

  appendTelemetryEvent({
    ts: new Date().toISOString(),
    event_key: "email_draft_created",
    source_path: "queue",
    tool_name: "gmail_create_draft",
    message_id: emailId,
    draft_id: draft.data.id ?? null,
    actor: "system",
  });

  return jsonResult({
    success: true,
    draftId: draft.data.id,
    threadId: original.data.threadId,
    message: "Draft created successfully. Review and send from Gmail.",
  });
}

export async function handleMarkProcessed(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { emailId, action, actor, sourcePath, prepaymentProvider } = markProcessedSchema.parse(args);

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const preModify = await gmail.users.messages.get({
    userId: "me",
    id: emailId,
    format: "metadata",
  });
  const queueFrom = resolveQueueStateFromLabels(preModify.data.labelIds || [], labelMap);
  const queueTo = resolveQueueTargetForAction(action);
  const actorLabelId = labelMap.get(actorToLabelName(actor));
  const queueLabelIds = collectLabelIds(labelMap, [
    LABELS.NEEDS_PROCESSING,
    LABELS.PROCESSING,
    LABELS.AWAITING_AGREEMENT,
    LABELS.DEFERRED,
    LEGACY_LABELS.NEEDS_PROCESSING,
    LEGACY_LABELS.PROCESSING,
    LEGACY_LABELS.AWAITING_AGREEMENT,
    LEGACY_LABELS.DEFERRED,
  ]);
  const outcomeLabelIds = collectLabelIds(labelMap, [
    LABELS.PROCESSED_DRAFTED,
    LABELS.PROCESSED_ACKNOWLEDGED,
    LABELS.PROCESSED_SKIPPED,
    LABELS.PROMOTIONAL,
    LABELS.SPAM,
    LEGACY_LABELS.PROCESSED_DRAFTED,
    LEGACY_LABELS.PROCESSED_ACKNOWLEDGED,
    LEGACY_LABELS.PROCESSED_SKIPPED,
    LEGACY_LABELS.PROMOTIONAL,
    LEGACY_LABELS.SPAM,
  ]);
  const allAgentLabelIds = collectLabelIds(labelMap, [
    LABELS.AGENT_CODEX,
    LABELS.AGENT_CLAUDE,
    LABELS.AGENT_HUMAN,
  ]);
  const workflowLabelIds = collectLabelIds(labelMap, [
    LABELS.WORKFLOW_PREPAYMENT_CHASE_1,
    LABELS.WORKFLOW_PREPAYMENT_CHASE_2,
    LABELS.WORKFLOW_PREPAYMENT_CHASE_3,
    LABELS.WORKFLOW_AGREEMENT_RECEIVED,
  ]);

  const addLabelIds: string[] = [];
  const removeLabelIds: string[] = [
    ...queueLabelIds,
    ...outcomeLabelIds,
    ...workflowLabelIds,
    ...allAgentLabelIds,
  ];
  if (actorLabelId) {
    addLabelIds.push(actorLabelId);
  }

  switch (action) {
    case "drafted": {
      const draftedLabelId = labelMap.get(LABELS.PROCESSED_DRAFTED);
      if (draftedLabelId) addLabelIds.push(draftedLabelId);
      break;
    }
    case "skipped": {
      const skippedLabelId = labelMap.get(LABELS.PROCESSED_SKIPPED);
      if (skippedLabelId) addLabelIds.push(skippedLabelId);
      break;
    }
    case "acknowledged": {
      const acknowledgedLabelId = labelMap.get(LABELS.PROCESSED_ACKNOWLEDGED);
      if (acknowledgedLabelId) addLabelIds.push(acknowledgedLabelId);
      break;
    }
    case "spam": {
      const spamLabelId = labelMap.get(LABELS.SPAM);
      if (spamLabelId) addLabelIds.push(spamLabelId);
      addLabelIds.push("SPAM");
      break;
    }
    case "promotional": {
      const promoLabelId = labelMap.get(LABELS.PROMOTIONAL);
      if (promoLabelId) addLabelIds.push(promoLabelId);
      removeLabelIds.push("INBOX");
      break;
    }
    case "deferred": {
      const deferredLabelId = labelMap.get(LABELS.DEFERRED);
      if (deferredLabelId) addLabelIds.push(deferredLabelId);
      break;
    }
    case "requeued": {
      const queueLabelId = labelMap.get(LABELS.NEEDS_PROCESSING);
      if (queueLabelId) addLabelIds.push(queueLabelId);
      break;
    }
    case "awaiting_agreement": {
      const awaitingLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (awaitingLabelId) addLabelIds.push(awaitingLabelId);
      break;
    }
    case "agreement_received": {
      const agreementLabelId = labelMap.get(LABELS.WORKFLOW_AGREEMENT_RECEIVED);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) addLabelIds.push(decisionLabelId);
      if (agreementLabelId) addLabelIds.push(agreementLabelId);
      break;
    }
    case "prepayment_chase_1": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_1);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) addLabelIds.push(decisionLabelId);
      if (chaseLabelId) addLabelIds.push(chaseLabelId);
      break;
    }
    case "prepayment_chase_2": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_2);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) addLabelIds.push(decisionLabelId);
      if (chaseLabelId) addLabelIds.push(chaseLabelId);
      break;
    }
    case "prepayment_chase_3": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_3);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) addLabelIds.push(decisionLabelId);
      if (chaseLabelId) addLabelIds.push(chaseLabelId);
      break;
    }
  }

  const uniqueAddLabelIds = Array.from(new Set(addLabelIds));
  const uniqueRemoveLabelIds = Array.from(
    new Set(removeLabelIds.filter(labelId => !uniqueAddLabelIds.includes(labelId)))
  );

  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: emailId,
      requestBody: {
        addLabelIds: uniqueAddLabelIds.length > 0 ? uniqueAddLabelIds : undefined,
        removeLabelIds: uniqueRemoveLabelIds.length > 0 ? uniqueRemoveLabelIds : undefined,
      },
    });
  } catch (error) {
    const cleanupStatus = await cleanupInProgress(emailId, gmail);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return errorResult(`Failed to apply labels: ${errorMessage}. ${cleanupStatus}`);
  }
  const lockStoreRef = getLockStore();
  lockStoreRef.release(emailId);
  const ts = new Date().toISOString();
  appendAuditEntry({ ts, messageId: emailId, action: "lock-released", actor: "system" });
  appendAuditEntry({ ts, messageId: emailId, action: "outcome", actor, result: action });
  appendTelemetryEvent({
    ts,
    event_key: "email_outcome_labeled",
    source_path: sourcePath,
    message_id: emailId,
    actor,
    action,
  });
  appendTelemetryEvent({
    ts,
    event_key: "email_queue_transition",
    source_path: sourcePath,
    message_id: emailId,
    actor,
    queue_from: queueFrom,
    queue_to: queueTo,
  });

  const workflow = isPrepaymentAction(action)
    ? {
        prepayment: resolvePrepaymentWorkflow({
          step: prepaymentStepFromAction(action),
          provider: prepaymentProvider as PrepaymentProvider | undefined,
        }),
      }
    : undefined;

  return jsonResult({
    success: true,
    message: `Email marked as ${action}`,
    action,
    actor,
    workflow,
  });
}

export async function handleTelemetryDailyRollup(
  args: unknown,
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { startDate, days } = telemetryDailyRollupSchema.parse(args ?? {});
  const now = new Date();
  const endExclusive = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  ));
  const start = startDate
    ? new Date(`${startDate}T00:00:00.000Z`)
    : new Date(endExclusive.getTime() - days * 24 * 60 * 60 * 1000);

  if (Number.isNaN(start.getTime())) {
    return errorResult("Invalid startDate. Expected YYYY-MM-DD.");
  }
  if (start >= endExclusive) {
    return errorResult("startDate must be before today (UTC).");
  }

  const events = readTelemetryEvents();
  const buckets = computeDailyTelemetryRollup(events, start, endExclusive);
  const totals = buckets.reduce(
    (acc, bucket) => {
      acc.drafted += bucket.drafted;
      acc.deferred += bucket.deferred;
      acc.requeued += bucket.requeued;
      acc.fallback += bucket.fallback;
      return acc;
    },
    { drafted: 0, deferred: 0, requeued: 0, fallback: 0 },
  );

  return jsonResult({
    success: true,
    source: "packages/mcp-server/data/email-audit-log.jsonl",
    window: {
      start: start.toISOString().slice(0, 10),
      endExclusive: endExclusive.toISOString().slice(0, 10),
      days: buckets.length,
    },
    totals,
    daily: buckets,
  });
}

export async function handleMigrateLabels(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult>> {
  const { dryRun, limitPerLabel } = migrateLabelsSchema.parse(args);
  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);

  const labelSummaries: Array<{
    legacyLabel: string;
    targetLabel: string;
    scanned: number;
    migrated: number;
    legacyLabelFound: boolean;
    targetLabelFound: boolean;
  }> = [];

  let totalScanned = 0;
  let totalMigrated = 0;

  for (const [legacyLabelName, targetLabelName] of Object.entries(LEGACY_TO_CURRENT_LABEL_MAP)) {
    const legacyLabelId = labelMap.get(legacyLabelName);
    const targetLabelId = labelMap.get(targetLabelName);

    if (!legacyLabelId || !targetLabelId) {
      labelSummaries.push({
        legacyLabel: legacyLabelName,
        targetLabel: targetLabelName,
        scanned: 0,
        migrated: 0,
        legacyLabelFound: Boolean(legacyLabelId),
        targetLabelFound: Boolean(targetLabelId),
      });
      continue;
    }

    let scannedForLabel = 0;
    let migratedForLabel = 0;
    let pageToken: string | undefined;

    while (scannedForLabel < limitPerLabel) {
      const pageSize = Math.min(100, limitPerLabel - scannedForLabel);
      const response = await gmail.users.messages.list({
        userId: "me",
        labelIds: [legacyLabelId],
        maxResults: pageSize,
        pageToken,
      });

      const messages = response.data.messages || [];
      if (messages.length === 0) break;

      scannedForLabel += messages.length;

      for (const message of messages) {
        if (!message.id) continue;
        if (!dryRun) {
          await gmail.users.messages.modify({
            userId: "me",
            id: message.id,
            requestBody: {
              addLabelIds: [targetLabelId],
              removeLabelIds: [legacyLabelId],
            },
          });
        }
        migratedForLabel += 1;
      }

      if (!response.data.nextPageToken || messages.length < pageSize) break;
      pageToken = response.data.nextPageToken;
    }

    totalScanned += scannedForLabel;
    totalMigrated += migratedForLabel;
    labelSummaries.push({
      legacyLabel: legacyLabelName,
      targetLabel: targetLabelName,
      scanned: scannedForLabel,
      migrated: migratedForLabel,
      legacyLabelFound: true,
      targetLabelFound: true,
    });
  }

  return jsonResult({
    success: true,
    dryRun,
    limitPerLabel,
    totals: {
      scanned: totalScanned,
      migrated: totalMigrated,
    },
    labels: labelSummaries,
  });
}
