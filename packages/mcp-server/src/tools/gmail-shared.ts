/**
 * Gmail Shared Module
 *
 * Shared types, constants, label definitions, and utility functions
 * used across all Gmail MCP tool modules.
 */

import * as fs from "node:fs";
import * as nodePath from "node:path";

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

import { createLockStore, type LockStore } from "../utils/lock-store.js";

// =============================================================================
// Constants
// =============================================================================

/**
 * Gmail label names for Brikette email workflow
 * These must be created manually in Gmail before use
 */
export const LABELS = {
  NEEDS_PROCESSING: "Brikette/Queue/Needs-Processing",
  PROCESSING: "Brikette/Queue/In-Progress",
  AWAITING_AGREEMENT: "Brikette/Queue/Needs-Decision",
  DEFERRED: "Brikette/Queue/Deferred",
  READY_FOR_REVIEW: "Brikette/Drafts/Ready-For-Review",
  SENT: "Brikette/Drafts/Sent",
  PROCESSED_DRAFTED: "Brikette/Outcome/Drafted",
  PROCESSED_ACKNOWLEDGED: "Brikette/Outcome/Acknowledged",
  PROCESSED_SKIPPED: "Brikette/Outcome/Skipped",
  WORKFLOW_PREPAYMENT_CHASE_1: "Brikette/Workflow/Prepayment-Chase-1",
  WORKFLOW_PREPAYMENT_CHASE_2: "Brikette/Workflow/Prepayment-Chase-2",
  WORKFLOW_PREPAYMENT_CHASE_3: "Brikette/Workflow/Prepayment-Chase-3",
  WORKFLOW_AGREEMENT_RECEIVED: "Brikette/Workflow/Agreement-Received",
  WORKFLOW_CANCELLATION_RECEIVED: "Brikette/Workflow/Cancellation-Received",
  WORKFLOW_CANCELLATION_PROCESSED: "Brikette/Workflow/Cancellation-Processed",
  WORKFLOW_CANCELLATION_PARSE_FAILED: "Brikette/Workflow/Cancellation-Parse-Failed",
  WORKFLOW_CANCELLATION_BOOKING_NOT_FOUND: "Brikette/Workflow/Cancellation-Booking-Not-Found",
  PROMOTIONAL: "Brikette/Outcome/Promotional",
  SPAM: "Brikette/Outcome/Spam",
  AGENT_CODEX: "Brikette/Agent/Codex",
  AGENT_CLAUDE: "Brikette/Agent/Claude",
  AGENT_HUMAN: "Brikette/Agent/Human",
  OUTBOUND_PRE_ARRIVAL: "Brikette/Outbound/Pre-Arrival",
  OUTBOUND_OPERATIONS: "Brikette/Outbound/Operations",
} as const;

export const LEGACY_LABELS = {
  NEEDS_PROCESSING: "Brikette/Inbox/Needs-Processing",
  PROCESSING: "Brikette/Inbox/Processing",
  AWAITING_AGREEMENT: "Brikette/Inbox/Awaiting-Agreement",
  DEFERRED: "Brikette/Inbox/Deferred",
  PROCESSED_DRAFTED: "Brikette/Processed/Drafted",
  PROCESSED_ACKNOWLEDGED: "Brikette/Processed/Acknowledged",
  PROCESSED_SKIPPED: "Brikette/Processed/Skipped",
  PROMOTIONAL: "Brikette/Promotional",
  SPAM: "Brikette/Spam",
} as const;

export const LEGACY_TO_CURRENT_LABEL_MAP: Record<string, string> = {
  [LEGACY_LABELS.NEEDS_PROCESSING]: LABELS.NEEDS_PROCESSING,
  [LEGACY_LABELS.PROCESSING]: LABELS.PROCESSING,
  [LEGACY_LABELS.AWAITING_AGREEMENT]: LABELS.AWAITING_AGREEMENT,
  [LEGACY_LABELS.DEFERRED]: LABELS.DEFERRED,
  [LEGACY_LABELS.PROCESSED_DRAFTED]: LABELS.PROCESSED_DRAFTED,
  [LEGACY_LABELS.PROCESSED_ACKNOWLEDGED]: LABELS.PROCESSED_ACKNOWLEDGED,
  [LEGACY_LABELS.PROCESSED_SKIPPED]: LABELS.PROCESSED_SKIPPED,
  [LEGACY_LABELS.PROMOTIONAL]: LABELS.PROMOTIONAL,
  [LEGACY_LABELS.SPAM]: LABELS.SPAM,
};

/**
 * Labels that represent a "done" or "in-flight" state for the organize-inbox
 * label-absence query. Emails already bearing any of these labels are excluded
 * from the scan so they are not re-processed.
 */
export const TERMINAL_LABELS: string[] = [
  LABELS.PROCESSING,
  LABELS.AWAITING_AGREEMENT,
  LABELS.DEFERRED,
  LABELS.READY_FOR_REVIEW,
  LABELS.SENT,
  LABELS.PROCESSED_DRAFTED,
  LABELS.PROCESSED_ACKNOWLEDGED,
  LABELS.PROCESSED_SKIPPED,
  LABELS.PROMOTIONAL,
  LABELS.SPAM,
];

export const REQUIRED_LABELS = [
  LABELS.NEEDS_PROCESSING,
  LABELS.PROCESSING,
  LABELS.AWAITING_AGREEMENT,
  LABELS.DEFERRED,
  LABELS.READY_FOR_REVIEW,
  LABELS.SENT,
  LABELS.PROCESSED_DRAFTED,
  LABELS.PROCESSED_ACKNOWLEDGED,
  LABELS.PROCESSED_SKIPPED,
  LABELS.WORKFLOW_PREPAYMENT_CHASE_1,
  LABELS.WORKFLOW_PREPAYMENT_CHASE_2,
  LABELS.WORKFLOW_PREPAYMENT_CHASE_3,
  LABELS.WORKFLOW_AGREEMENT_RECEIVED,
  LABELS.WORKFLOW_CANCELLATION_RECEIVED,
  LABELS.WORKFLOW_CANCELLATION_PROCESSED,
  LABELS.WORKFLOW_CANCELLATION_PARSE_FAILED,
  LABELS.WORKFLOW_CANCELLATION_BOOKING_NOT_FOUND,
  LABELS.PROMOTIONAL,
  LABELS.SPAM,
  LABELS.AGENT_CODEX,
  LABELS.AGENT_CLAUDE,
  LABELS.AGENT_HUMAN,
  LABELS.OUTBOUND_PRE_ARRIVAL,
  LABELS.OUTBOUND_OPERATIONS,
];

export const PROCESSING_TIMEOUT_MS = 30 * 60 * 1000;

// =============================================================================
// Lock store
// =============================================================================

// Default lock store instance (file-backed). Replaceable in tests via setLockStore().
let lockStoreRef: LockStore = createLockStore();

/**
 * Replaces the module-level lock store instance.
 * Use in tests to inject a mock or a store backed by a temp directory.
 */
export function setLockStore(store: LockStore): void {
  lockStoreRef = store;
}

export function getLockStore(): LockStore {
  return lockStoreRef;
}

// =============================================================================
// Types
// =============================================================================

export type AgentActor = "codex" | "claude" | "human";

/**
 * An entry in the append-only email processing audit log.
 * Written as JSON-lines (one JSON object per line) to data/email-audit-log.jsonl.
 */
export interface AuditEntry {
  ts: string;           // ISO 8601 UTC timestamp
  messageId: string;
  action: "lock-acquired" | "lock-released" | "outcome" | "booking-dedup-skipped";
  actor: string;
  result?: string;      // only present for action === "outcome" or "booking-dedup-skipped"
}

export type EmailSourcePath = "queue" | "reception" | "outbound" | "unknown";

export type TelemetryEventKey =
  | "email_draft_created"
  | "email_draft_deferred"
  | "email_outcome_labeled"
  | "email_queue_transition"
  | "email_fallback_detected";

export interface TelemetryEvent {
  ts: string;
  event_key: TelemetryEventKey;
  source_path: EmailSourcePath;
  actor: string;
  tool_name?: string;
  message_id?: string | null;
  draft_id?: string | null;
  action?: string;
  reason?: string;
  classification?: string;
  queue_from?: string | null;
  queue_to?: string | null;
}

// TASK-04: Zod schema for TelemetryEvent validation on read.
export const TelemetryEventSchema = z.object({
  ts: z.string(),
  event_key: z.enum([
    "email_draft_created",
    "email_draft_deferred",
    "email_outcome_labeled",
    "email_queue_transition",
    "email_fallback_detected",
  ]),
  source_path: z.enum(["queue", "reception", "outbound", "unknown"]),
  actor: z.string(),
  tool_name: z.string().optional(),
  message_id: z.string().nullable().optional(),
  draft_id: z.string().nullable().optional(),
  action: z.string().optional(),
  reason: z.string().optional(),
  classification: z.string().optional(),
  queue_from: z.string().nullable().optional(),
  queue_to: z.string().nullable().optional(),
}).passthrough();

export interface EmailHeader {
  name: string;
  value: string;
}

export interface PendingEmail {
  id: string;
  threadId: string;
  from: {
    name: string;
    email: string;
  };
  subject: string;
  receivedAt: string;
  snippet: string;
  labels: string[];
  isReply: boolean;
}

export interface EmailDetails extends PendingEmail {
  body: {
    plain: string;
    html?: string;
  };
  attachments: {
    filename: string;
    mimeType: string;
    size: number;
  }[];
  threadContext?: {
    messages: {
      from: string;
      date: string;
      snippet: string;
    }[];
  };
}

type DraftOutcomeOutboundCategory = "pre-arrival" | "operations";

export interface ApplyDraftOutcomeLabelsInput {
  draftMessageId: string;
  sourcePath: EmailSourcePath;
  actor?: AgentActor;
  outboundCategory?: DraftOutcomeOutboundCategory;
  toolName?: string;
}

export interface DailyRollupBucket {
  day: string;
  drafted: number;
  deferred: number;
  requeued: number;
  fallback: number;
}

export type PrepaymentAction = "prepayment_chase_1" | "prepayment_chase_2" | "prepayment_chase_3";

export function isPrepaymentAction(action: string): action is PrepaymentAction {
  return (
    action === "prepayment_chase_1" ||
    action === "prepayment_chase_2" ||
    action === "prepayment_chase_3"
  );
}

// =============================================================================
// Audit log
// =============================================================================

/**
 * Resolves the default audit log path.
 * Priority:
 *   1. AUDIT_LOG_PATH env var (used in tests to redirect to a temp directory)
 *   2. mcp-server package root (cwd = packages/mcp-server) -> data/email-audit-log.jsonl
 *   3. monorepo root (cwd = repo root) -> packages/mcp-server/data/email-audit-log.jsonl
 */
export function resolveDefaultAuditLogPath(): string {
  if (process.env.AUDIT_LOG_PATH) {
    return process.env.AUDIT_LOG_PATH;
  }
  const fromMonorepoRoot = nodePath.join(
    process.cwd(),
    "packages",
    "mcp-server",
    "data",
    "email-audit-log.jsonl"
  );
  const fromPackageRoot = nodePath.join(
    process.cwd(),
    "data",
    "email-audit-log.jsonl"
  );
  // Prefer the candidate whose parent data/ dir exists, else fall back to monorepo-root path.
  if (fs.existsSync(nodePath.dirname(fromPackageRoot))) {
    return fromPackageRoot;
  }
  return fromMonorepoRoot;
}

/**
 * Appends a single JSON-lines audit entry to the audit log.
 *
 * - Creates the data/ directory if it does not exist.
 * - Never throws -- audit failure must not break tool flow.
 *
 * @param entry   The audit entry to write.
 * @param logPath Override for the log file path (used in tests).
 */
export function appendAuditEntry(entry: AuditEntry, logPath?: string): void {
  const filePath = logPath ?? resolveDefaultAuditLogPath();
  try {
    fs.mkdirSync(nodePath.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, JSON.stringify(entry) + "\n");
  } catch (err) {
    // Audit failure must never break tool flow -- log to stderr and continue.
    process.stderr.write(
      `[audit-log] Failed to write audit entry: ${String(err)}\n`
    );
  }
}

export function appendTelemetryEvent(
  event: TelemetryEvent,
  logPath?: string,
): void {
  const filePath = logPath ?? resolveDefaultAuditLogPath();
  try {
    fs.mkdirSync(nodePath.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, JSON.stringify(event) + "\n");
  } catch (err) {
    process.stderr.write(
      `[audit-log] Failed to write telemetry event: ${String(err)}\n`,
    );
  }
}

export function readTelemetryEvents(logPath?: string): TelemetryEvent[] {
  const filePath = logPath ?? resolveDefaultAuditLogPath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n");
  const events: TelemetryEvent[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const parsed = JSON.parse(line);
      const result = TelemetryEventSchema.safeParse(parsed);
      if (result.success) {
        events.push(result.data as TelemetryEvent);
      } else {
        console.warn(
          `[telemetry] Skipped invalid event at line ${i + 1}: ${result.error.issues[0]?.message ?? "unknown"}`,
        );
      }
    } catch {
      console.warn(`[telemetry] Skipped malformed JSON at line ${i + 1}`);
    }
  }
  return events;
}

export function computeDailyTelemetryRollup(
  events: TelemetryEvent[],
  start: Date,
  endExclusive: Date,
): DailyRollupBucket[] {
  const buckets = new Map<string, DailyRollupBucket>();
  const getBucket = (day: string): DailyRollupBucket => {
    const existing = buckets.get(day);
    if (existing) return existing;
    const created: DailyRollupBucket = {
      day,
      drafted: 0,
      deferred: 0,
      requeued: 0,
      fallback: 0,
    };
    buckets.set(day, created);
    return created;
  };

  for (const event of events) {
    const ts = new Date(event.ts);
    if (Number.isNaN(ts.getTime())) continue;
    if (ts < start || ts >= endExclusive) continue;
    const day = ts.toISOString().slice(0, 10);
    const bucket = getBucket(day);

    if (event.event_key === "email_draft_created") {
      bucket.drafted += 1;
      continue;
    }
    if (event.event_key === "email_draft_deferred") {
      bucket.deferred += 1;
      continue;
    }
    if (event.event_key === "email_fallback_detected") {
      bucket.fallback += 1;
      continue;
    }
    if (event.event_key === "email_queue_transition" && event.queue_to === LABELS.NEEDS_PROCESSING) {
      bucket.requeued += 1;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => a.day.localeCompare(b.day));
}

// =============================================================================
// Helper Functions (shared across tools)
// =============================================================================

/**
 * Parse email address from header value
 * Handles formats like "Name <email@example.com>" and "email@example.com"
 */
export function parseEmailAddress(value: string): { name: string; email: string } {
  // Try to extract email from angle brackets first: "Name <email@example.com>" or <email@example.com>
  const angleMatch = value.match(/<([^>]+)>/);
  if (angleMatch) {
    const email = angleMatch[1].trim();
    // Get name by removing the angle bracket part
    const name = value.replace(/<[^>]+>/, "").replace(/"/g, "").trim();
    return {
      name: name || email,
      email,
    };
  }

  // If no angle brackets, treat entire value as email (or simple email format)
  const trimmed = value.trim();
  return { name: trimmed, email: trimmed };
}

/**
 * Get header value from message headers
 */
export function getHeader(headers: EmailHeader[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

/**
 * Extract plain text and HTML body from message payload
 */
export function extractBody(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: Array<{
    mimeType?: string;
    body?: { data?: string };
    parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
  }>;
}): { plain: string; html?: string } {
  const result: { plain: string; html?: string } = { plain: "" };

  function decodeBase64(data: string): string {
    // Gmail API uses URL-safe base64
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  }

  function extractFromPart(part: {
    mimeType?: string;
    body?: { data?: string };
    parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
  }): void {
    if (part.mimeType === "text/plain" && part.body?.data) {
      result.plain = decodeBase64(part.body.data);
    } else if (part.mimeType === "text/html" && part.body?.data) {
      result.html = decodeBase64(part.body.data);
    } else if (part.parts) {
      for (const subpart of part.parts) {
        extractFromPart(subpart);
      }
    }
  }

  // Handle simple messages with body at top level
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    result.plain = decodeBase64(payload.body.data);
  } else if (payload.mimeType === "text/html" && payload.body?.data) {
    result.html = decodeBase64(payload.body.data);
    // Convert HTML to plain text as fallback
    result.plain = result.html.replace(/<[^>]+>/g, "").trim();
  } else if (payload.parts) {
    for (const part of payload.parts) {
      extractFromPart(part);
    }
  }

  return result;
}

/**
 * Extract attachments from message payload
 */
export function extractAttachments(payload: {
  parts?: Array<{
    filename?: string;
    mimeType?: string;
    body?: { size?: number };
  }>;
}): { filename: string; mimeType: string; size: number }[] {
  const attachments: { filename: string; mimeType: string; size: number }[] = [];

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.filename && part.filename.length > 0) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || "application/octet-stream",
          size: part.body?.size || 0,
        });
      }
    }
  }

  return attachments;
}

/**
 * Get label ID by name
 */
export async function ensureLabelMap(
  gmail: gmail_v1.Gmail,
  labelNames: string[]
): Promise<Map<string, string>> {
  const response = await gmail.users.labels.list({ userId: "me" });
  const labels = response.data.labels || [];
  const labelMap = new Map<string, string>(
    labels
      .filter((label): label is gmail_v1.Schema$Label => !!label)
      .map((label): [string, string] => [
        label.name ?? "",
        label.id ?? "",
      ])
      .filter(([name, id]) => name.length > 0 && id.length > 0)
  );

  for (const labelName of labelNames) {
    if (labelMap.has(labelName)) continue;
    try {
      const created = await gmail.users.labels.create({
        userId: "me",
        requestBody: {
          name: labelName,
          labelListVisibility: "labelShow",
          messageListVisibility: "show",
        },
      });
      if (created.data?.id) {
        labelMap.set(labelName, created.data.id);
      }
    } catch {
      // If creation fails (permissions, etc.), leave missing labels unresolved.
    }
  }

  return labelMap;
}

export function collectLabelIds(
  labelMap: Map<string, string>,
  labelNames: string[]
): string[] {
  return labelNames
    .map(labelName => labelMap.get(labelName))
    .filter((labelId): labelId is string => !!labelId);
}

export function actorToLabelName(actor: AgentActor): string {
  switch (actor) {
    case "claude":
      return LABELS.AGENT_CLAUDE;
    case "human":
      return LABELS.AGENT_HUMAN;
    case "codex":
    default:
      return LABELS.AGENT_CODEX;
  }
}

export function isProcessingLockStale(messageId: string): boolean {
  return lockStoreRef.isStale(messageId, PROCESSING_TIMEOUT_MS);
}

export function formatGmailQueryDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

export function parseMessageTimestamp(
  dateHeader: string | undefined,
  internalDate: string | null | undefined
): number | null {
  if (dateHeader) {
    const parsedHeader = Date.parse(dateHeader);
    if (!Number.isNaN(parsedHeader)) {
      return parsedHeader;
    }
  }

  if (internalDate) {
    const parsedInternal = Number(internalDate);
    if (!Number.isNaN(parsedInternal)) {
      return parsedInternal;
    }
  }

  return null;
}

export function resolveDraftOutcomeLabelNames(
  actor: AgentActor,
  outboundCategory?: DraftOutcomeOutboundCategory
): string[] {
  const labelNames = [
    LABELS.READY_FOR_REVIEW,
    LABELS.PROCESSED_DRAFTED,
    actorToLabelName(actor),
  ];

  if (outboundCategory === "pre-arrival") {
    labelNames.push(LABELS.OUTBOUND_PRE_ARRIVAL);
  } else if (outboundCategory === "operations") {
    labelNames.push(LABELS.OUTBOUND_OPERATIONS);
  }

  return labelNames;
}

export async function applyDraftOutcomeLabelsStrict(
  gmail: gmail_v1.Gmail,
  input: ApplyDraftOutcomeLabelsInput
): Promise<{ appliedLabelNames: string[] }> {
  const {
    draftMessageId,
    sourcePath,
    actor = "human",
    outboundCategory,
    toolName = "unknown_tool",
  } = input;

  const normalizedMessageId = draftMessageId.trim();
  if (!normalizedMessageId) {
    throw new Error("Draft created but Gmail did not return message ID; cannot apply outcome labels.");
  }

  const labelNames = resolveDraftOutcomeLabelNames(actor, outboundCategory);
  const labelMap = await ensureLabelMap(gmail, labelNames);
  const missingLabels = labelNames.filter((labelName) => !labelMap.get(labelName));
  if (missingLabels.length > 0) {
    throw new Error(
      `Missing required Gmail labels for drafted outcome: ${missingLabels.join(", ")}`
    );
  }

  const addLabelIds = collectLabelIds(labelMap, labelNames);
  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: normalizedMessageId,
      requestBody: {
        addLabelIds,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to apply draft outcome labels (${labelNames.join(", ")}): ${errorMessage}`
    );
  }

  appendTelemetryEvent({
    ts: new Date().toISOString(),
    event_key: "email_outcome_labeled",
    source_path: sourcePath,
    actor,
    tool_name: toolName,
    message_id: normalizedMessageId,
    action: "drafted",
  });

  return { appliedLabelNames: labelNames };
}

export function hasBriketteLabel(
  labelIds: string[] | null | undefined,
  labelNameById: Map<string, string>
): boolean {
  for (const labelId of labelIds || []) {
    const labelName = labelNameById.get(labelId);
    if (!labelName) continue;
    if (labelName === "Brikette" || labelName.startsWith("Brikette/")) {
      return true;
    }
  }
  return false;
}

/**
 * Attempts to remove the In-Progress label from an email and release the
 * processing lock. Called on error paths to avoid leaving an email stuck.
 *
 * Never throws -- always returns a status string.
 */
export async function cleanupInProgress(emailId: string, gmail: gmail_v1.Gmail): Promise<string> {
  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const inProgressLabelIds = collectLabelIds(labelMap, [
    LABELS.PROCESSING,
    LEGACY_LABELS.PROCESSING,
  ]);
  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: emailId,
      requestBody: {
        removeLabelIds: inProgressLabelIds.length > 0 ? inProgressLabelIds : undefined,
      },
    });
    lockStoreRef.release(emailId);
    appendAuditEntry({ ts: new Date().toISOString(), messageId: emailId, action: "lock-released", actor: "system" });
    return "cleanup succeeded";
  } catch (cleanupError) {
    lockStoreRef.release(emailId);
    appendAuditEntry({ ts: new Date().toISOString(), messageId: emailId, action: "lock-released", actor: "system" });
    const msg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
    return `cleanup failed: ${msg}`;
  }
}

export function resolveQueueStateFromLabels(
  labelIds: string[],
  labelMap: Map<string, string>,
): string | null {
  const queueOrder = [
    LABELS.NEEDS_PROCESSING,
    LABELS.PROCESSING,
    LABELS.AWAITING_AGREEMENT,
    LABELS.DEFERRED,
    LEGACY_LABELS.NEEDS_PROCESSING,
    LEGACY_LABELS.PROCESSING,
    LEGACY_LABELS.AWAITING_AGREEMENT,
    LEGACY_LABELS.DEFERRED,
  ];
  for (const labelName of queueOrder) {
    const labelId = labelMap.get(labelName);
    if (labelId && labelIds.includes(labelId)) {
      return labelName;
    }
  }
  return null;
}

export function resolveQueueTargetForAction(action: string): string | null {
  if (action === "deferred") {
    return LABELS.DEFERRED;
  }
  if (action === "requeued") {
    return LABELS.NEEDS_PROCESSING;
  }
  if (
    action === "awaiting_agreement" ||
    action === "agreement_received" ||
    action === "prepayment_chase_1" ||
    action === "prepayment_chase_2" ||
    action === "prepayment_chase_3"
  ) {
    return LABELS.AWAITING_AGREEMENT;
  }
  return null;
}

export function isAgreementReplySignal(subject: string, snippet: string): boolean {
  const subjectMatches = subject
    .toLowerCase()
    .includes("re: your hostel brikette reservation");
  if (!subjectMatches) {
    return false;
  }

  const normalizedSnippet = normalizeWhitespace(snippet).toLowerCase();
  const opening = normalizedSnippet.slice(0, 160);
  const hasAgreeSignal =
    opening.startsWith("agree") ||
    opening.startsWith("i agree") ||
    opening.includes(" agree ") ||
    opening.includes(" agreed ");
  const hasNegativeSignal =
    opening.includes("do not agree") ||
    opening.includes("don't agree");

  return hasAgreeSignal && !hasNegativeSignal;
}

export function extractSenderEmailAddress(fromRaw: string): string {
  const parsed = parseEmailAddress(fromRaw);
  return parsed.email.toLowerCase();
}

export function extractSenderDomain(emailAddress: string): string {
  const atIndex = emailAddress.lastIndexOf("@");
  if (atIndex < 0) return "";
  return emailAddress.slice(atIndex + 1);
}

export function isNoReplySender(emailAddress: string): boolean {
  const atIndex = emailAddress.lastIndexOf("@");
  const localPart = (atIndex >= 0 ? emailAddress.slice(0, atIndex) : emailAddress).toLowerCase();
  return /^(no[-_.]?reply|noreply|do[-_.]?not[-_.]?reply|donotreply)$/.test(localPart);
}

export function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_match, digits) => {
      const codePoint = Number.parseInt(digits, 10);
      return Number.isNaN(codePoint) ? "" : String.fromCharCode(codePoint);
    });
}

export function normalizeWhitespace(raw: string): string {
  return decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
}
