/**
 * Gmail Reconciliation Module
 *
 * Handles the gmail_reconcile_in_progress tool which routes stale
 * In-Progress emails back to appropriate states.
 */

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

import { errorResult, jsonResult } from "../utils/validation.js";

import { classifyOrganizeDecision } from "./gmail-classify.js";
import {
  collectLabelIds,
  type EmailHeader,
  ensureLabelMap,
  getHeader,
  isAgreementReplySignal,
  LABELS,
  LEGACY_LABELS,
  parseMessageTimestamp,
  REQUIRED_LABELS,
} from "./gmail-shared.js";

// =============================================================================
// Schema
// =============================================================================

export const reconcileInProgressSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  staleHours: z.number().min(1).max(24 * 30).optional().default(2),
  limit: z.number().min(1).max(200).optional().default(100),
  actor: z.enum(["codex", "claude", "human"]).optional().default("codex"),
});

// =============================================================================
// Handler
// =============================================================================

export async function handleReconcileInProgress(
  gmail: gmail_v1.Gmail,
  args: unknown,
  handleMarkProcessedFn: (gmail: gmail_v1.Gmail, args: unknown) => Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>>,
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { dryRun, staleHours, limit, actor } = reconcileInProgressSchema.parse(args);
  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);

  const processingLabelIds = collectLabelIds(labelMap, [
    LABELS.PROCESSING,
    LEGACY_LABELS.PROCESSING,
  ]);

  if (processingLabelIds.length === 0) {
    return errorResult(
      `Label "${LABELS.PROCESSING}" not found in Gmail. ` +
      `Please create the Brikette label hierarchy first.`
    );
  }

  const messageMap = new Map<string, { id: string }>();
  for (const labelId of processingLabelIds) {
    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: [labelId],
      maxResults: limit,
    });

    const messages = response.data.messages || [];
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
  const samples: Array<{
    emailId: string;
    subject: string;
    from: string;
    ageHours: number | null;
    action: "agreement_received" | "requeued" | "promotional" | "spam" | "skipped";
    reason: string;
  }> = [];

  const counts = {
    scanned: 0,
    keptFresh: 0,
    routedAgreementReceived: 0,
    routedRequeued: 0,
    routedPromotional: 0,
    routedSpam: 0,
    routedSkipped: 0,
  };

  for (const msg of messages) {
    if (!msg.id) continue;
    counts.scanned += 1;

    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "metadata",
      metadataHeaders: [
        "From",
        "Subject",
        "Date",
        "List-Unsubscribe",
        "List-Id",
        "Precedence",
      ],
    });

    const headers = (detail.data.payload?.headers || []) as EmailHeader[];
    const subject = getHeader(headers, "Subject") || "(no subject)";
    const from = getHeader(headers, "From") || "";
    const snippet = detail.data.snippet || "";
    const messageTs = parseMessageTimestamp(
      getHeader(headers, "Date"),
      detail.data.internalDate
    );
    const ageHours =
      messageTs === null ? null : Math.max(0, (Date.now() - messageTs) / (1000 * 60 * 60));

    if (ageHours !== null && ageHours < staleHours) {
      counts.keptFresh += 1;
      continue;
    }

    let action: "agreement_received" | "requeued" | "promotional" | "spam" | "skipped";
    let reason: string;

    if (isAgreementReplySignal(subject, snippet)) {
      action = "agreement_received";
      reason = "stale-agreement-reply";
    } else {
      const classification = classifyOrganizeDecision(
        from,
        subject,
        snippet,
        Boolean(getHeader(headers, "List-Unsubscribe")),
        Boolean(getHeader(headers, "List-Id")),
        /bulk|list/i.test(getHeader(headers, "Precedence") || "")
      );

      switch (classification.decision) {
        case "promotional": {
          action = "promotional";
          reason = `stale-${classification.reason}`;
          break;
        }
        case "spam": {
          action = "spam";
          reason = `stale-${classification.reason}`;
          break;
        }
        case "trash": {
          action = "skipped";
          reason = `stale-${classification.reason}`;
          break;
        }
        default: {
          action = "requeued";
          reason = `stale-requeue-${classification.reason}`;
          break;
        }
      }
    }

    if (!dryRun) {
      await handleMarkProcessedFn(gmail, {
        emailId: msg.id,
        action,
        actor,
      });
    }

    switch (action) {
      case "agreement_received":
        counts.routedAgreementReceived += 1;
        break;
      case "requeued":
        counts.routedRequeued += 1;
        break;
      case "promotional":
        counts.routedPromotional += 1;
        break;
      case "spam":
        counts.routedSpam += 1;
        break;
      case "skipped":
        counts.routedSkipped += 1;
        break;
    }

    if (samples.length < 50) {
      samples.push({
        emailId: msg.id,
        subject,
        from,
        ageHours,
        action,
        reason,
      });
    }
  }

  return jsonResult({
    success: true,
    dryRun,
    staleHours,
    limit,
    actor,
    counts,
    samples,
    policy:
      "Stale customer threads are requeued for prompt handling; stale agreement replies are routed to agreement_received.",
  });
}
