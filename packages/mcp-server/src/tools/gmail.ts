/**
 * Gmail MCP Tools for Brikette Email Processing
 *
 * Thin orchestration layer: tool definitions, tool handler dispatch,
 * and re-exports for backward compatibility.
 *
 * Handler implementations extracted to:
 *   - gmail-shared.ts         (types, constants, label definitions, audit/telemetry)
 *   - gmail-classify.ts       (email classification pipeline)
 *   - gmail-booking.ts        (booking reservation processing)
 *   - gmail-organize.ts       (organize-inbox handler)
 *   - gmail-reconciliation.ts (reconcile-in-progress handler)
 *   - gmail-handlers.ts       (list-pending, list-query, get-email, create-draft,
 *                              mark-processed, telemetry-rollup, migrate-labels)
 */

import { getGmailClient } from "../clients/gmail.js";
import { errorResult, formatError } from "../utils/validation.js";

import {
  handleCreateDraft,
  handleGetEmail,
  handleListPending,
  handleListQuery,
  handleMarkProcessed,
  handleMigrateLabels,
  handleTelemetryDailyRollup,
} from "./gmail-handlers.js";
// ---- Internal imports for dispatch ----
import { handleOrganizeInbox } from "./gmail-organize.js";
import { handleReconcileInProgress } from "./gmail-reconciliation.js";

// ---- Re-exports for backward compatibility ----
// External consumers (tests, sibling tools, index.ts) import from "./gmail.js"
// and these re-exports resolve to the extracted modules transparently.

export {
  type BookingReservationDetails, type BookingReservationSample,   buildNewReservationDraft,
  checkBookingRefDuplicate, type DeferredSample,
  handleCancellationCase, parseNewReservationNotification,
processBookingReservationNotification,
} from "./gmail-booking.js";
export {
  classifyOrganizeDecision, type OrganizeClassification,
  type OrganizeDecision, shouldTrashAsGarbage,
} from "./gmail-classify.js";
export {
  handleCreateDraft, handleGetEmail,
  handleListPending, handleListQuery, handleMarkProcessed,
handleMigrateLabels,
  handleTelemetryDailyRollup, } from "./gmail-handlers.js";
export { handleOrganizeInbox } from "./gmail-organize.js";
export { handleReconcileInProgress } from "./gmail-reconciliation.js";
export {
actorToLabelName,
  type AgentActor,   appendAuditEntry, appendTelemetryEvent,   type ApplyDraftOutcomeLabelsInput, applyDraftOutcomeLabelsStrict,
type AuditEntry, cleanupInProgress,
collectLabelIds,   computeDailyTelemetryRollup,
type DailyRollupBucket, decodeHtmlEntities, type EmailDetails,
  type EmailHeader, type EmailSourcePath,
  ensureLabelMap, extractAttachments,
extractBody, extractSenderDomain,
extractSenderEmailAddress, formatGmailQueryDate, getHeader, getLockStore,
  hasBriketteLabel,   isAgreementReplySignal,   isNoReplySender,   isPrepaymentAction,   isProcessingLockStale,   LABELS, LEGACY_LABELS, LEGACY_TO_CURRENT_LABEL_MAP,
normalizeWhitespace,   parseEmailAddress, parseMessageTimestamp,
type PendingEmail, type PrepaymentAction,
PROCESSING_TIMEOUT_MS,
readTelemetryEvents,
  REQUIRED_LABELS, resolveDefaultAuditLogPath,
  resolveDraftOutcomeLabelNames,   resolveQueueStateFromLabels, resolveQueueTargetForAction,
  setLockStore, type TelemetryEvent,
  type TelemetryEventKey, TelemetryEventSchema,
TERMINAL_LABELS, } from "./gmail-shared.js";

// =============================================================================
// Tool Definitions
// =============================================================================

export const gmailTools = [
  {
    name: "gmail_organize_inbox",
    description: "Scan unread inbox emails (all unread by default), trash known garbage patterns, and label customer emails as Brikette/Queue/Needs-Processing.",
    inputSchema: {
      type: "object",
      properties: {
        testMode: { type: "boolean", description: "Deprecated. Kept for backward compatibility.", default: false },
        specificStartDate: { type: "string", description: "Optional start date (YYYY-MM-DD). If provided, scan unread emails from this date onward." },
        limit: { type: "number", description: "Max unread threads to scan (1-500)", default: 500 },
        dryRun: { type: "boolean", description: "If true, report actions without changing labels or trash", default: false },
      },
    },
  },
  {
    name: "gmail_list_pending",
    description: "List customer emails in the Brikette inbox that need responses. Returns emails with the 'Brikette/Queue/Needs-Processing' label.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max emails to return (1-50)", default: 20 },
      },
    },
  },
  {
    name: "gmail_list_query",
    description: "List emails using a Gmail query string (e.g., in:inbox after:YYYY/MM/DD before:YYYY/MM/DD).",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Gmail search query" },
        limit: { type: "number", description: "Max emails to return (1-100)", default: 50 },
      },
      required: ["query"],
    },
  },
  {
    name: "gmail_get_email",
    description: "Get full details of a specific email including sender, subject, body, and optionally thread context for replies.",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "Gmail message ID" },
        includeThread: { type: "boolean", description: "Include previous messages in thread", default: true },
        actor: {
          type: "string",
          enum: ["codex", "claude", "human"],
          description: "Actor claiming processing ownership for Agent/* labels.",
          default: "codex",
        },
      },
      required: ["emailId"],
    },
  },
  {
    name: "gmail_create_draft",
    description: "Create a draft reply to a customer email in Gmail. The draft will be threaded with the original email.",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "Original email ID to reply to" },
        subject: { type: "string", description: "Email subject (usually RE: original subject)" },
        bodyPlain: { type: "string", description: "Plain text email body" },
        bodyHtml: { type: "string", description: "HTML email body (optional, for branded emails)" },
      },
      required: ["emailId", "subject", "bodyPlain"],
    },
  },
  {
    name: "gmail_mark_processed",
    description: "Mark an email as processed by updating its labels. Use after creating a draft or deciding to skip/defer an email.",
    inputSchema: {
      type: "object",
      properties: {
        emailId: { type: "string", description: "Gmail message ID" },
        prepaymentProvider: {
          type: "string",
          enum: ["octorate", "hostelworld"],
          description: "Optional prepayment provider for chase templates.",
        },
        actor: {
          type: "string",
          enum: ["codex", "claude", "human"],
          description: "Actor applying the state transition for Agent/* labels.",
          default: "codex",
        },
        sourcePath: {
          type: "string",
          enum: ["queue", "reception", "outbound", "unknown"],
          description: "Telemetry source path for outcome attribution.",
          default: "queue",
        },
        action: {
          type: "string",
          enum: [
            "drafted", "skipped", "spam", "deferred", "requeued",
            "acknowledged", "promotional", "awaiting_agreement",
            "agreement_received", "prepayment_chase_1",
            "prepayment_chase_2", "prepayment_chase_3",
          ],
          description: "How the email was handled: drafted (draft created), skipped (no response needed), spam (mark as spam), deferred (pause processing), requeued (return to Needs-Processing for prompt handling), acknowledged (informational email - no reply needed but noted), promotional (marketing/newsletter - archive for batch review), awaiting_agreement (T&C reply needed), agreement_received (T&C confirmed), prepayment_chase_1/2/3 (payment reminders).",
        },
      },
      required: ["emailId", "action"],
    },
  },
  {
    name: "gmail_telemetry_daily_rollup",
    description: "Read daily telemetry rollups from the append-only audit log (drafted, deferred, requeued, fallback).",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Optional UTC start date (YYYY-MM-DD)." },
        days: { type: "number", description: "Number of days to summarize (1-90).", default: 7 },
      },
    },
  },
  {
    name: "gmail_migrate_labels",
    description: "Migrate legacy Brikette label taxonomy (Inbox/Processed) to Queue/Outcome labels.",
    inputSchema: {
      type: "object",
      properties: {
        dryRun: { type: "boolean", description: "Preview migration without mutating labels.", default: true },
        limitPerLabel: { type: "number", description: "Max messages to migrate per legacy label.", default: 500 },
      },
    },
  },
  {
    name: "gmail_reconcile_in_progress",
    description: "Reconcile stale In-Progress emails: route stale agreement replies to agreement_received and stale unresolved customer threads back to Needs-Processing.",
    inputSchema: {
      type: "object",
      properties: {
        dryRun: { type: "boolean", description: "Preview only; do not modify labels.", default: true },
        staleHours: { type: "number", description: "Age threshold in hours before reconciliation applies.", default: 2 },
        limit: { type: "number", description: "Maximum in-progress messages to inspect.", default: 100 },
        actor: {
          type: "string",
          enum: ["codex", "claude", "human"],
          description: "Actor applying transitions.",
          default: "codex",
        },
      },
    },
  },
] as const;

// =============================================================================
// Tool Handler (dispatch)
// =============================================================================

export async function handleGmailTool(name: string, args: unknown) {
  if (name === "gmail_telemetry_daily_rollup") {
    return handleTelemetryDailyRollup(args);
  }

  // Get Gmail client
  const clientResult = await getGmailClient();
  if (!clientResult.success) {
    if (clientResult.needsSetup) {
      return errorResult(
        `Gmail not configured. ${clientResult.error}\n\n` +
        `To set up Gmail:\n` +
        `1. Create OAuth credentials in Google Cloud Console\n` +
        `2. Save credentials.json to packages/mcp-server/\n` +
        `3. Run: cd packages/mcp-server && pnpm gmail:auth`
      );
    }
    return errorResult(clientResult.error);
  }

  const gmail = clientResult.client;

  try {
    switch (name) {
      case "gmail_organize_inbox":
        return await handleOrganizeInbox(gmail, args);
      case "gmail_list_pending":
        return await handleListPending(gmail, args);
      case "gmail_list_query":
        return await handleListQuery(gmail, args);
      case "gmail_get_email":
        return await handleGetEmail(gmail, args);
      case "gmail_create_draft":
        return await handleCreateDraft(gmail, args);
      case "gmail_mark_processed":
        return await handleMarkProcessed(gmail, args);
      case "gmail_telemetry_daily_rollup":
        return await handleTelemetryDailyRollup(args);
      case "gmail_migrate_labels":
        return await handleMigrateLabels(gmail, args);
      case "gmail_reconcile_in_progress":
        return await handleReconcileInProgress(gmail, args, handleMarkProcessed);
      default:
        return errorResult(`Unknown gmail tool: ${name}`);
    }
  } catch (error) {
    const err = error as { code?: number; message?: string };
    if (err.code === 429) {
      return errorResult(
        `Gmail API rate limit exceeded. Please wait a few minutes and try again.\n` +
        `(Error: ${err.message || "Rate limit"})`
      );
    }
    if (err.code === 401 || err.code === 403) {
      return errorResult(
        `Gmail authentication error. Token may have expired.\n` +
        `Run: cd packages/mcp-server && pnpm gmail:auth\n` +
        `(Error: ${err.message || "Auth failed"})`
      );
    }
    return errorResult(formatError(error));
  }
}
