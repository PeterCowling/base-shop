/**
 * Gmail MCP Tools for Brikette Email Processing
 *
 * Tools for email workflow:
 * - gmail_organize_inbox: Scan unread inbox, trash known garbage, label customer emails for queue
 * - gmail_list_pending: List emails needing response
 * - gmail_get_email: Get full email details with thread context
 * - gmail_create_draft: Create a draft reply
 * - gmail_mark_processed: Update email queue status via labels
 * - gmail_reconcile_in_progress: Resolve stale in-progress items via policy
 */

import * as fs from "node:fs";
import * as nodePath from "node:path";

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

import { getGmailClient } from "../clients/gmail.js";
import { createRawEmail } from "../utils/email-mime.js";
import { generateEmailHtml } from "../utils/email-template.js";
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";
import {
  type PrepaymentProvider,
  prepaymentStepFromAction,
  resolvePrepaymentWorkflow,
} from "../utils/workflow-triggers.js";

import { processCancellationEmail } from "./process-cancellation-email.js";

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

const LEGACY_LABELS = {
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

const LEGACY_TO_CURRENT_LABEL_MAP: Record<string, string> = {
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

type AgentActor = "codex" | "claude" | "human";

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

const PROCESSING_TIMEOUT_MS = 30 * 60 * 1000;
const processingLocks = new Map<string, number>();

// =============================================================================
// Audit log
// =============================================================================

/**
 * An entry in the append-only email processing audit log.
 * Written as JSON-lines (one JSON object per line) to data/email-audit-log.jsonl.
 */
export interface AuditEntry {
  ts: string;           // ISO 8601 UTC timestamp
  messageId: string;
  action: "lock-acquired" | "outcome";
  actor: string;
  result?: string;      // only present for action === "outcome"
}

/**
 * Resolves the default audit log path.
 * Priority:
 *   1. AUDIT_LOG_PATH env var (used in tests to redirect to a temp directory)
 *   2. mcp-server package root (cwd = packages/mcp-server) → data/email-audit-log.jsonl
 *   3. monorepo root (cwd = repo root) → packages/mcp-server/data/email-audit-log.jsonl
 */
function resolveDefaultAuditLogPath(): string {
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
 * - Never throws — audit failure must not break tool flow.
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
    // Audit failure must never break tool flow — log to stderr and continue.
    process.stderr.write(
      `[audit-log] Failed to write audit entry: ${String(err)}\n`
    );
  }
}

const GARBAGE_FROM_PATTERNS = [
  "promotion-it@amazon.it",
  "groupupdates@facebookmail.com",
  "friendsuggestion@facebookmail.com",
  "pageupdates@facebookmail.com",
];

const GARBAGE_OCTORATE_FROM_PATTERN = "noreply@smtp.octorate.com";
const GARBAGE_OCTORATE_SUBJECT_PREFIX = "warning - payment process failed";

const BOOKING_MONITOR_FROM_PATTERNS = [
  "noreply@smtp.octorate.com",
];

const BOOKING_MONITOR_SUBJECT_PATTERNS = [
  /^new reservation\b/i,
];

const CANCELLATION_MONITOR_FROM_PATTERNS = [
  "noreply@smtp.octorate.com",
];

const CANCELLATION_MONITOR_SUBJECT_PATTERNS = [
  /^new cancellation\b/i,
];

const TERMS_AND_CONDITIONS_URL =
  "https://docs.google.com/document/d/1-Qr5uCli0_vnTgmd9yTjLDtIDVcusGJYyCcnC_fPmf0/edit?usp=sharing";

const NON_CUSTOMER_FROM_PATTERNS = [
  "noreply@booking.com",
  "no-reply@booking.com",
  "noreply@hotels.com",
  "noreply@expedia.com",
  "noreply@agoda.com",
  "noreply@airbnb.com",
  "noreply@hostelworld.com",
  "mailer-daemon@",
  "postmaster@",
  "noreply@smtp.octorate.com",
  "noreply-apps-scripts-notifications@google.com",
  "cloudplatform-noreply@google.com",
  "italoimpresa@mailing.italotreno.it",
  "cmcowling@me.com",
  "hostelpositano@gmail.com",
];

const NON_CUSTOMER_SUBJECT_PATTERNS = [
  /^(re:|fwd:)?\s*booking confirmation/i,
  /^(re:|fwd:)?\s*reservation confirmed/i,
  /^(re:|fwd:)?\s*your booking/i,
  /^(re:|fwd:)?\s*payment received/i,
  /^(re:|fwd:)?\s*invoice/i,
  /^(re:|fwd:)?\s*receipt/i,
  /newsletter/i,
  /unsubscribe/i,
  /^(re:|fwd:)?\s*out of office/i,
  /^(re:|fwd:)?\s*automatic reply/i,
  /delivery status notification/i,
  /^returned mail/i,
  /new reservation/i,
  /new cancellation/i,
  /hostelworld confirmed booking/i,
  /^screenshot\s+\d{4}-\d{2}-\d{2}/i,
  /\bjob application\b/i,
  /\bterms of service\b/i,
  /\bprivacy policy\b/i,
  /\bannual report\b/i,
  /\bfattura\b/i,
];

const CUSTOMER_SUBJECT_PATTERNS = [
  /your hostel brikette reservation/i,
  /\bavailability\b/i,
  /\bbooking\b/i,
  /\breservation\b/i,
  /\bcheck[\s-]?in\b/i,
  /\bcheck[\s-]?out\b/i,
  /\barriv(?:e|al)\b/i,
  /\bcancel(?:lation)?\b/i,
  /\brefund\b/i,
  /\bpayment\b/i,
  /\bquestion\b/i,
];

const CUSTOMER_SNIPPET_PATTERNS = [
  /\bavailability\b/i,
  /\bbooking\b/i,
  /\breservation\b/i,
  /\bcheck[\s-]?in\b/i,
  /\bcheck[\s-]?out\b/i,
  /\barriv(?:e|al)\b/i,
  /\bcancel(?:lation)?\b/i,
  /\brefund\b/i,
  /\bluggage\b/i,
  /\bbreakfast\b/i,
  /\bwi[\s-]?fi\b/i,
  /\bquestion\b/i,
];

const SPAM_SUBJECT_PATTERNS = [
  /\byou(?:'|’)ve won\b/i,
  /\blottery\b/i,
  /\bbitcoin\b/i,
  /\bcrypto investment\b/i,
  /\burgent transfer\b/i,
  /\bwire transfer\b/i,
  /\baccount suspended\b/i,
];

const NON_CUSTOMER_DOMAINS = [
  "booking.com",
  "properties.booking.com",
  "expedia.com",
  "expediagroup.com",
  "expediapartnercentral.com",
  "hotels.com",
  "agoda.com",
  "hostelworld.com",
  "tripadvisor.com",
  "kayak.com",
  "trivago.com",
  "mailchimp.com",
  "sendgrid.net",
  "amazonses.com",
  "smtp.octorate.com",
  "marketing.octorate.com",
  "accounts.google.com",
  "mailing.italotreno.it",
  "revolut.com",
  "nordaccount.com",
  "ausino.it",
];

const CUSTOMER_DOMAIN_EXCEPTIONS = new Set([
  "guest.booking.com",
]);

// =============================================================================
// Zod Schemas
// =============================================================================

const listPendingSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(20),
});

const organizeInboxSchema = z.object({
  testMode: z.boolean().optional().default(false),
  specificStartDate: z.string().optional(),
  limit: z.number().min(1).max(500).optional().default(500),
  dryRun: z.boolean().optional().default(false),
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

const markProcessedSchema = z.object({
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
  prepaymentProvider: z.enum(["octorate", "hostelworld"]).optional(),
});

const migrateLabelsSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  limitPerLabel: z.number().int().min(1).max(1000).optional().default(500),
});

const reconcileInProgressSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  staleHours: z.number().min(1).max(24 * 30).optional().default(24),
  limit: z.number().min(1).max(200).optional().default(100),
  actor: z.enum(["codex", "claude", "human"]).optional().default("codex"),
});

type PrepaymentAction = "prepayment_chase_1" | "prepayment_chase_2" | "prepayment_chase_3";

function isPrepaymentAction(action: string): action is PrepaymentAction {
  return (
    action === "prepayment_chase_1" ||
    action === "prepayment_chase_2" ||
    action === "prepayment_chase_3"
  );
}

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
        action: {
          type: "string",
          enum: [
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
          ],
          description: "How the email was handled: drafted (draft created), skipped (no response needed), spam (mark as spam), deferred (pause processing), requeued (return to Needs-Processing for prompt handling), acknowledged (informational email - no reply needed but noted), promotional (marketing/newsletter - archive for batch review), awaiting_agreement (T&C reply needed), agreement_received (T&C confirmed), prepayment_chase_1/2/3 (payment reminders).",
        },
      },
      required: ["emailId", "action"],
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
        staleHours: { type: "number", description: "Age threshold in hours before reconciliation applies.", default: 24 },
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
// Helper Types
// =============================================================================

interface EmailHeader {
  name: string;
  value: string;
}

interface PendingEmail {
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

interface EmailDetails extends PendingEmail {
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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse email address from header value
 * Handles formats like "Name <email@example.com>" and "email@example.com"
 */
function parseEmailAddress(value: string): { name: string; email: string } {
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
function getHeader(headers: EmailHeader[], name: string): string {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header?.value || "";
}

/**
 * Extract plain text and HTML body from message payload
 */
function extractBody(payload: {
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
function extractAttachments(payload: {
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

function actorToLabelName(actor: AgentActor): string {
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

function isProcessingLockStale(
  lockTimestamp: number | undefined,
  internalDate: string | null | undefined
): boolean {
  if (lockTimestamp) {
    return Date.now() - lockTimestamp > PROCESSING_TIMEOUT_MS;
  }
  if (internalDate) {
    const parsed = Number(internalDate);
    if (!Number.isNaN(parsed)) {
      return Date.now() - parsed > PROCESSING_TIMEOUT_MS;
    }
  }
  return false;
}

function formatGmailQueryDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

function parseMessageTimestamp(
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

function isAgreementReplySignal(subject: string, snippet: string): boolean {
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

function extractSenderEmailAddress(fromRaw: string): string {
  const parsed = parseEmailAddress(fromRaw);
  return parsed.email.toLowerCase();
}

function extractSenderDomain(emailAddress: string): string {
  const atIndex = emailAddress.lastIndexOf("@");
  if (atIndex < 0) return "";
  return emailAddress.slice(atIndex + 1);
}

function isNoReplySender(emailAddress: string): boolean {
  const atIndex = emailAddress.lastIndexOf("@");
  const localPart = (atIndex >= 0 ? emailAddress.slice(0, atIndex) : emailAddress).toLowerCase();
  return /^(no[-_.]?reply|noreply|do[-_.]?not[-_.]?reply|donotreply)$/.test(localPart);
}

function hasBriketteLabel(
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

function shouldTrashAsGarbage(fromRaw: string, subject: string): boolean {
  const fromLower = fromRaw.toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (GARBAGE_FROM_PATTERNS.some(pattern => fromLower.includes(pattern))) {
    return true;
  }

  return (
    fromLower.includes(GARBAGE_OCTORATE_FROM_PATTERN) &&
    subjectLower.startsWith(GARBAGE_OCTORATE_SUBJECT_PREFIX)
  );
}

type OrganizeDecision =
  | "needs_processing"
  | "booking_reservation"
  | "cancellation"
  | "promotional"
  | "spam"
  | "deferred"
  | "trash";

interface OrganizeClassification {
  decision: OrganizeDecision;
  reason: string;
  senderEmail: string;
}

function classifyOrganizeDecision(
  fromRaw: string,
  subject: string,
  snippet: string,
  hasListUnsubscribeHeader: boolean,
  hasListIdHeader: boolean,
  hasBulkPrecedenceHeader: boolean
): OrganizeClassification {
  const fromLower = fromRaw.toLowerCase();
  const senderEmail = extractSenderEmailAddress(fromRaw);
  const senderDomain = extractSenderDomain(senderEmail);
  const snippetLower = snippet.toLowerCase();

  if (shouldTrashAsGarbage(fromRaw, subject)) {
    return { decision: "trash", reason: "matched-garbage-rule", senderEmail };
  }

  if (SPAM_SUBJECT_PATTERNS.some(pattern => pattern.test(subject))) {
    return { decision: "spam", reason: "matched-spam-pattern", senderEmail };
  }

  const matchesBookingMonitorSender = BOOKING_MONITOR_FROM_PATTERNS.some((pattern) =>
    fromLower.includes(pattern)
  );
  const matchesBookingMonitorSubject = BOOKING_MONITOR_SUBJECT_PATTERNS.some((pattern) =>
    pattern.test(subject)
  );
  if (matchesBookingMonitorSender && matchesBookingMonitorSubject) {
    return { decision: "booking_reservation", reason: "new-reservation-notification", senderEmail };
  }

  const matchesCancellationMonitorSender = CANCELLATION_MONITOR_FROM_PATTERNS.some((pattern) =>
    fromLower.includes(pattern)
  );
  const matchesCancellationMonitorSubject = CANCELLATION_MONITOR_SUBJECT_PATTERNS.some((pattern) =>
    pattern.test(subject)
  );
  if (matchesCancellationMonitorSender && matchesCancellationMonitorSubject) {
    return { decision: "cancellation", reason: "new-cancellation-notification", senderEmail };
  }

  const hasNoReplySender = isNoReplySender(senderEmail);
  const hasNonCustomerFromPattern = NON_CUSTOMER_FROM_PATTERNS.some(pattern =>
    fromLower.includes(pattern)
  );
  const hasNonCustomerSubjectPattern = NON_CUSTOMER_SUBJECT_PATTERNS.some(pattern =>
    pattern.test(subject)
  );
  const hasNonCustomerDomain =
    Boolean(senderDomain) &&
    !CUSTOMER_DOMAIN_EXCEPTIONS.has(senderDomain) &&
    NON_CUSTOMER_DOMAINS.some(
      domain => senderDomain === domain || senderDomain.endsWith(`.${domain}`)
    );
  const hasListSignals =
    hasListUnsubscribeHeader || hasListIdHeader || hasBulkPrecedenceHeader;

  const hasStrongCustomerDomain = CUSTOMER_DOMAIN_EXCEPTIONS.has(senderDomain);
  const hasCustomerSubjectPattern = CUSTOMER_SUBJECT_PATTERNS.some(pattern =>
    pattern.test(subject)
  );
  const hasCustomerSnippetPattern = CUSTOMER_SNIPPET_PATTERNS.some(pattern =>
    pattern.test(snippetLower)
  );
  const hasQuestionSignal = subject.includes("?") || snippet.includes("?");
  const hasCustomerSignals =
    hasStrongCustomerDomain ||
    hasCustomerSubjectPattern ||
    hasCustomerSnippetPattern ||
    hasQuestionSignal;

  const hasNonCustomerSignals =
    hasNoReplySender ||
    hasNonCustomerFromPattern ||
    hasNonCustomerSubjectPattern ||
    hasNonCustomerDomain ||
    hasListSignals;

  const hasStrongNonCustomerSignals =
    hasNoReplySender ||
    hasNonCustomerFromPattern ||
    hasNonCustomerDomain ||
    hasListSignals;

  if (hasCustomerSignals && !hasNonCustomerSignals) {
    return { decision: "needs_processing", reason: "customer-signal", senderEmail };
  }

  // Strong machine/OTA/newsletter signals should be routed directly, even if
  // the subject contains booking-related words like "reservation" or "cancellation".
  if (hasStrongNonCustomerSignals && !hasStrongCustomerDomain) {
    return { decision: "promotional", reason: "strong-non-customer-signal", senderEmail };
  }

  if (hasNonCustomerSignals && !hasCustomerSignals) {
    if (
      hasNoReplySender ||
      hasNonCustomerFromPattern ||
      hasNonCustomerSubjectPattern ||
      hasNonCustomerDomain ||
      hasListSignals
    ) {
      return { decision: "promotional", reason: "non-customer-signal", senderEmail };
    }
  }

  if (hasCustomerSignals && hasNonCustomerSignals) {
    return {
      decision: "deferred",
      reason: "mixed-signals-needs-review",
      senderEmail,
    };
  }

  if (!hasCustomerSignals && !hasNonCustomerSignals) {
    return {
      decision: "deferred",
      reason: "low-confidence-needs-review",
      senderEmail,
    };
  }

  return { decision: "deferred", reason: "fallback-needs-review", senderEmail };
}

interface BookingReservationDetails {
  reservationCode: string;
  guestEmail: string;
  guestName?: string;
  checkInDate?: string;
  nights?: number;
  totalPrice?: string;
  nonRefundable: boolean;
  paymentTerms: string;
  bookingSource: string;
  roomSummary?: string;
  roomNumbers?: number[];
}

interface BookingReservationSample {
  threadId: string;
  messageId: string;
  subject: string;
  from: string;
  guestEmail: string;
  draftId?: string;
}

interface DeferredSample {
  threadId: string;
  messageId: string;
  subject: string;
  from: string;
  senderEmail: string;
  reason: string;
}

function decodeHtmlEntities(raw: string): string {
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

function normalizeWhitespace(raw: string): string {
  return decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
}

function normalizeReservationCode(raw: string): string {
  const cleaned = normalizeWhitespace(raw);
  if (!cleaned) return "";
  const [firstChunk] = cleaned.split("_");
  return firstChunk.trim();
}

function extractFirstMatch(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    for (let index = 1; index < match.length; index += 1) {
      const candidate = normalizeWhitespace(match[index] ?? "");
      if (candidate) return candidate;
    }
  }
  return "";
}

function parseFlexibleDate(rawDate: string): string {
  const value = normalizeWhitespace(rawDate);
  if (!value) return "";

  const ymd = value.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    const year = Number.parseInt(ymd[1], 10);
    const month = Number.parseInt(ymd[2], 10);
    const day = Number.parseInt(ymd[3], 10);
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  const dmy = value.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmy) {
    const day = Number.parseInt(dmy[1], 10);
    const month = Number.parseInt(dmy[2], 10);
    let year = Number.parseInt(dmy[3], 10);
    if (year < 100) year += 2000;
    const date = new Date(Date.UTC(year, month - 1, day));
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function parsePrice(rawPrice: string): string {
  const value = normalizeWhitespace(rawPrice);
  const match = value.match(/([\d.,]+)/);
  if (!match) return "";

  let normalized = match[1];
  if (normalized.includes(".") && normalized.includes(",")) {
    if (normalized.lastIndexOf(".") > normalized.lastIndexOf(",")) {
      normalized = normalized.replace(/,/g, "");
    } else {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    }
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const number = Number.parseFloat(normalized);
  if (!Number.isFinite(number)) return "";
  return number.toFixed(2);
}

function deriveBookingSource(reservationCode: string): string {
  if (reservationCode.length === 10) return "Booking.com";
  if (reservationCode.length === 6) return "Hostel Brikette's Website";
  return "Hostelworld";
}

function derivePaymentTerms(reservationCode: string, nonRefundable: boolean): string {
  const isBookingDotCom = reservationCode.length === 10;
  if (nonRefundable) {
    return "Your booking is pre-paid and non-refundable.";
  }
  if (isBookingDotCom) {
    return "Your reservation is refundable according to the terms of your booking. Payment can be made before or during check-in.";
  }
  return "Payment is due upon arrival at the hostel.";
}

function extractGuestEmail(combined: string): string {
  const candidates = Array.from(
    new Set(
      (combined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g) || [])
        .map(email => email.toLowerCase())
    )
  );
  return candidates.find((email) =>
    !email.includes("smtp.octorate.com") &&
    !email.includes("booking.com") &&
    !email.includes("hostelworld.com")
  ) || "";
}

function computeNights(checkInDate: string, checkOutDate: string): number | undefined {
  if (!checkInDate || !checkOutDate) return undefined;
  const start = new Date(`${checkInDate}T00:00:00Z`);
  const end = new Date(`${checkOutDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return undefined;
  const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return diffDays > 0 ? diffDays : undefined;
}

function applyHostelworldCommission(totalPrice: string, reservationCode: string): string {
  if (!reservationCode.startsWith("7763-")) return totalPrice;

  const total = Number.parseFloat(totalPrice);
  if (!Number.isFinite(total) || total <= 0) return totalPrice;

  const adjusted = total - ((total / 1.1) * 0.15);
  return adjusted.toFixed(2);
}

function formatLongDate(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;

  const day = date.getUTCDate();
  const suffix = (day >= 11 && day <= 13)
    ? "th"
    : (day % 10 === 1 ? "st" : day % 10 === 2 ? "nd" : day % 10 === 3 ? "rd" : "th");
  const month = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const year = date.getUTCFullYear();
  return `${day}${suffix} of ${month}, ${year}`;
}

function extractRoomNumbers(text: string): number[] {
  const matches = Array.from(text.matchAll(/\broom\s*#?\s*(\d{1,2})\b/gi));
  const numbers = matches
    .map(match => Number.parseInt(match[1] || "", 10))
    .filter(number => Number.isFinite(number));
  return Array.from(new Set(numbers));
}

function getRoomDescription(roomNumber: number): string {
  if (roomNumber === 3 || roomNumber === 4) {
    return "Value dorm, with air conditioning, and external shared restrooms.";
  }
  if (roomNumber === 5 || roomNumber === 6) {
    return "Superior dorm, with air conditioning and restroom";
  }
  if (roomNumber === 7) {
    return "Double room, private, with air conditioning and sea view terrace";
  }
  if (roomNumber === 8) {
    return "Garden view dorm, with air conditioning and shared bathroom.";
  }
  if (roomNumber === 9 || roomNumber === 10) {
    return "Premium dorm, with air conditioning and restroom";
  }
  if (roomNumber === 11 || roomNumber === 12) {
    return "Superior dorm, with air conditioning and restroom";
  }
  return "Room details not available";
}

function getBedDescription(roomNumber: number): string {
  if (roomNumber === 3 || roomNumber === 4) {
    return "Four bunk beds, for a total of eight beds";
  }
  if (roomNumber === 5) {
    return "Three bunk beds, for a total of six beds";
  }
  if (roomNumber === 6) {
    return "Three bunk beds, plus one single bed, for a total of seven beds.";
  }
  if (roomNumber === 7) {
    return "One double bed.";
  }
  if (roomNumber === 8) {
    return "One bunk bed, for a total of two beds.";
  }
  if (roomNumber === 9) {
    return "3 beds.";
  }
  if (roomNumber === 10 || roomNumber === 11 || roomNumber === 12) {
    return "3 bunk beds, for a total of 6 beds.";
  }
  return "Bed details not available";
}

function getRoomView(roomNumber: number): string {
  if (roomNumber === 3 || roomNumber === 4 || roomNumber === 9 || roomNumber === 10) {
    return "No view";
  }
  if (roomNumber === 5 || roomNumber === 6 || roomNumber === 7) {
    return "Sea view, with terrace";
  }
  if (roomNumber === 8) {
    return "Garden view";
  }
  if (roomNumber === 11 || roomNumber === 12) {
    return "Oversized sea view terrace";
  }
  return "No view available";
}

function parseNewReservationNotification(
  subject: string,
  plainBody: string,
  htmlBody?: string
): BookingReservationDetails | null {
  const combined = [subject, plainBody, htmlBody ?? ""].join("\n");
  const reservationCode = normalizeReservationCode(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*reservation code\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
      /\bnew reservation\s+([A-Za-z0-9_-]+)/i,
    ])
  );

  const guestName = extractFirstMatch(combined, [
    /<td[^>]*>\s*(?:<b>)?\s*guest name\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
  ]);
  const guestEmail = extractFirstMatch(combined, [
    /<td[^>]*>\s*email\s*<\/td>\s*<td[^>]*>\s*<a[^>]*?href="mailto:([^"]+)"[^>]*>[^<]*<\/a>\s*<\/td>/i,
    /<td[^>]*>\s*email\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/i,
  ]) || extractGuestEmail(combined);

  const checkInFromBody = parseFlexibleDate(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*check\s*[-]?\s*in\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
    ])
  );
  const subjectDateMatch = subject.match(
    /\bbooking\s+(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})/i
  );
  const checkInDate = checkInFromBody || (subjectDateMatch?.[1] ?? "");
  const checkOutDateFromSubject = subjectDateMatch?.[2] ?? "";

  const nightsFromBody = Number.parseInt(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*nights\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>/i,
    ]),
    10
  );

  const nightsFromDates = computeNights(checkInDate, checkOutDateFromSubject);
  const nights = Number.isFinite(nightsFromBody) && nightsFromBody > 0
    ? nightsFromBody
    : nightsFromDates;

  const baseTotalPrice = parsePrice(
    extractFirstMatch(combined, [
      /<td[^>]*>\s*(?:<b>)?\s*total amount\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      /<td[^>]*>\s*(?:<b>)?\s*total to be cashed\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      /<td[^>]*>\s*(?:<b>)?\s*total net\s*(?:<\/b>)?\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
    ])
  );
  const totalPrice = applyHostelworldCommission(baseTotalPrice, reservationCode);

  const roomMatches = Array.from(
    combined.matchAll(/<td[^>]*><b>\s*([^<]*room[^<]*)\s*<\/b><\/td>\s*<td[^>]*>([^<]*)<\/td>/gi)
  );
  const roomSummary = roomMatches
    .map((match) => `${normalizeWhitespace(match[1] ?? "")} - ${normalizeWhitespace(match[2] ?? "")}`)
    .filter(Boolean)
    .join(" | ");
  const roomNumbers = extractRoomNumbers(`${roomSummary} ${combined}`);

  if (!guestEmail) {
    return null;
  }

  const nonRefundable = /non\s*[-]?\s*refund/i.test(combined);
  const bookingSource = deriveBookingSource(reservationCode);
  const paymentTerms = derivePaymentTerms(reservationCode, nonRefundable);

  return {
    reservationCode,
    guestEmail,
    guestName,
    checkInDate: checkInDate || undefined,
    nights: nights || undefined,
    totalPrice: totalPrice || undefined,
    nonRefundable,
    paymentTerms,
    bookingSource,
    roomSummary: roomSummary || undefined,
    roomNumbers: roomNumbers.length > 0 ? roomNumbers : undefined,
  };
}

function buildNewReservationDraft(details: BookingReservationDetails): {
  subject: string;
  bodyPlain: string;
  bodyHtml: string;
} {
  const guestName = (details.guestName || "Guest").trim();
  const checkIn = details.checkInDate ? formatLongDate(details.checkInDate) : "";
  const numberOfGuests = 1;
  const nights = details.nights ?? 1;
  const totalPrice = details.totalPrice ?? "";
  const roomNumbers = details.roomNumbers ?? [];

  const summaryLines: string[] = [
    `Dear ${guestName},`,
    "",
    "Thank you for choosing to stay with us. Below is some essential information.",
    "",
  ];

  if (details.nonRefundable && details.reservationCode.length !== 10) {
    summaryLines.push(
      "ACTION REQUIRED",
      "Please reply with \"Agree\" within 48 hours.",
      "If we do not receive agreement within this time, we won't be able to hold your booking.",
      "Replying agree confirms your agreement with our terms and conditions for room bookings:",
      `(${TERMS_AND_CONDITIONS_URL})`,
      "and enables us to process payment for your room.",
      "Thanks!",
      ""
    );
  }

  summaryLines.push(
    "HERE ARE YOUR RESERVATION DETAILS:",
    `Source: ${details.bookingSource}`,
    `Reservation Code: ${details.reservationCode}`
  );

  if (checkIn) {
    summaryLines.push(`Check-in: ${checkIn}`);
  }

  summaryLines.push(
    `Number of Guests: ${numberOfGuests}`,
    `Nights: ${nights}`,
    `Amount due for room: €${totalPrice}`,
    `Payment terms for room: ${details.paymentTerms}`,
    "City Tax Due: Positano has a City Tax of €2.50 per guest, per night. Must be paid in euros as cash.",
    "Key Deposits: A €10 keycard deposit (per keycard) is required at check-in. Paid in euros as cash.",
    ""
  );

  if (roomNumbers.length > 0) {
    const heading = roomNumbers.length === 1 ? "ROOM" : "ROOMS";
    summaryLines.push(heading);

    for (const roomNumber of roomNumbers) {
      const description = getRoomDescription(roomNumber);
      const beds = getBedDescription(roomNumber);
      const view = getRoomView(roomNumber);
      const commaIndex = description.indexOf(",");
      const roomType = commaIndex > 0 ? description.slice(0, commaIndex).trim() : description;
      const facilities = commaIndex > 0 ? description.slice(commaIndex + 1).trim() : "";

      summaryLines.push(
        "",
        `-- Details for Room #${roomNumber} --`,
        `Room number: ${roomNumber}`,
        `Room type: ${roomType}`,
        `Facilities: ${facilities}`,
        `Beds: ${beds}`,
        `View: ${view}`
      );
    }
    summaryLines.push("");
  }

  const bodyPlain = summaryLines.join("\n");
  const subject = "Your Hostel Brikette Reservation";
  const recipientName = guestName;
  const bodyHtml = generateEmailHtml({
    recipientName,
    bodyText: bodyPlain,
    includeBookingLink: false,
    subject,
  });

  return { subject, bodyPlain, bodyHtml };
}

async function processBookingReservationNotification({
  gmail,
  messageId,
  threadId,
  subject,
  fromRaw,
  senderEmail,
  dryRun,
  deferredLabelId,
  processedDraftedLabelId,
}: {
  gmail: gmail_v1.Gmail;
  messageId: string;
  threadId: string;
  subject: string;
  fromRaw: string;
  senderEmail: string;
  dryRun: boolean;
  deferredLabelId?: string;
  processedDraftedLabelId?: string;
}): Promise<
  | { status: "processed"; sample: BookingReservationSample }
  | { status: "deferred"; sample: DeferredSample }
> {
  const fullMessage = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });
  const extractedBody = extractBody(
    fullMessage.data.payload as Parameters<typeof extractBody>[0]
  );
  const reservation = parseNewReservationNotification(
    subject,
    extractedBody.plain,
    extractedBody.html
  );

  if (!reservation) {
    if (!dryRun) {
      await gmail.users.messages.modify({
        userId: "me",
        id: messageId,
        requestBody: {
          addLabelIds: deferredLabelId ? [deferredLabelId] : [],
          removeLabelIds: ["INBOX"],
        },
      });
    }

    return {
      status: "deferred",
      sample: {
        threadId,
        messageId,
        subject,
        from: fromRaw,
        senderEmail,
        reason: "new-reservation-parse-failed",
      },
    };
  }

  const bookingDraft = buildNewReservationDraft(reservation);
  let createdDraftId: string | undefined;
  if (!dryRun) {
    const raw = createRawEmail(
      reservation.guestEmail,
      bookingDraft.subject,
      bookingDraft.bodyPlain,
      bookingDraft.bodyHtml
    );
    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: {
        message: { raw },
      },
    });
    createdDraftId = draft.data.id ?? undefined;

    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: processedDraftedLabelId ? [processedDraftedLabelId] : [],
        removeLabelIds: ["INBOX", "UNREAD"],
      },
    });
  }

  return {
    status: "processed",
    sample: {
      threadId,
      messageId,
      subject,
      from: fromRaw,
      guestEmail: reservation.guestEmail,
      draftId: createdDraftId,
    },
  };
}

// =============================================================================
// Tool Case Handlers
// =============================================================================

/**
 * Handle cancellation email processing.
 * Extracts the cancellation workflow logic from the main organize inbox switch case.
 */
async function handleCancellationCase({
  gmail,
  labelMap,
  latestMessage,
  dryRun,
  fromRaw,
}: {
  gmail: gmail_v1.Gmail;
  labelMap: Map<string, string>;
  latestMessage: gmail_v1.Schema$Message;
  dryRun: boolean;
  fromRaw: string;
}): Promise<{ processed: boolean }> {
  const cancellationReceivedLabelId = labelMap.get(LABELS.WORKFLOW_CANCELLATION_RECEIVED);
  const cancellationProcessedLabelId = labelMap.get(LABELS.WORKFLOW_CANCELLATION_PROCESSED);
  const cancellationParseFailedLabelId = labelMap.get(LABELS.WORKFLOW_CANCELLATION_PARSE_FAILED);
  const cancellationBookingNotFoundLabelId = labelMap.get(
    LABELS.WORKFLOW_CANCELLATION_BOOKING_NOT_FOUND
  );

  if (!cancellationReceivedLabelId) {
    throw new Error(`Missing required label: ${LABELS.WORKFLOW_CANCELLATION_RECEIVED}`);
  }

  // Apply Cancellation-Received label immediately
  if (!dryRun) {
    await gmail.users.messages.modify({
      userId: "me",
      id: latestMessage.id!,
      requestBody: {
        addLabelIds: [cancellationReceivedLabelId],
        removeLabelIds: [],
      },
    });
  }

  // Extract email body for processing
  const extractedBody = extractBody(latestMessage.payload as Parameters<typeof extractBody>[0]);
  const emailHtml = extractedBody.html || extractedBody.plain;

  // Invoke processCancellationEmail tool (mock in tests, real in production)
  const firebaseUrl = process.env.FIREBASE_DATABASE_URL || "";
  const firebaseApiKey = process.env.FIREBASE_API_KEY;

  try {
    const result = await processCancellationEmail(
      latestMessage.id!,
      emailHtml,
      fromRaw,
      firebaseUrl,
      firebaseApiKey
    );

    // Apply status-specific label based on tool result
    let statusLabelId: string | undefined;
    if (result.status === "success" && cancellationProcessedLabelId) {
      statusLabelId = cancellationProcessedLabelId;
    } else if (result.status === "parse-failed" && cancellationParseFailedLabelId) {
      statusLabelId = cancellationParseFailedLabelId;
    } else if (result.status === "booking-not-found" && cancellationBookingNotFoundLabelId) {
      statusLabelId = cancellationBookingNotFoundLabelId;
    }

    if (statusLabelId && !dryRun) {
      await gmail.users.messages.modify({
        userId: "me",
        id: latestMessage.id!,
        requestBody: {
          addLabelIds: [statusLabelId],
          removeLabelIds: ["INBOX", "UNREAD"],
        },
      });
    }

    return { processed: true };
  } catch (error) {
    // Log error but don't throw - we've already marked it as received
    console.error(`Failed to process cancellation email ${latestMessage.id}:`, error);
    return { processed: false };
  }
}

async function handleOrganizeInbox(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { testMode, specificStartDate, limit, dryRun } = organizeInboxSchema.parse(args);

  let query = "is:unread in:inbox";
  let startDateString: string | null = null;
  let tomorrowDateString: string | null = null;

  if (specificStartDate) {
    const parsed = new Date(specificStartDate);
    if (Number.isNaN(parsed.getTime())) {
      return errorResult(`Invalid specificStartDate: ${specificStartDate}`);
    }
    startDateString = formatGmailQueryDate(parsed);
    tomorrowDateString = formatGmailQueryDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
    query = `${query} after:${startDateString} before:${tomorrowDateString}`;
  }

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

  const response = await gmail.users.threads.list({
    userId: "me",
    q: query,
    maxResults: limit,
  });

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
      mode: specificStartDate ? "from-date" : "all-unread",
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

async function handleListPending(
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


async function handleListQuery(
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

async function handleGetEmail(
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

  const messageLabelIds = msg.labelIds || [];
  if (messageLabelIds.some(labelId => processingLabelIds.includes(labelId))) {
    const isStale = isProcessingLockStale(
      processingLocks.get(emailId),
      msg.internalDate
    );
    if (isStale) {
      await gmail.users.messages.modify({
        userId: "me",
        id: emailId,
        requestBody: {
          removeLabelIds: processingLabelIds,
        },
      });
      processingLocks.delete(emailId);
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
        ...allAgentLabelIds,
      ],
    },
  });
  processingLocks.set(emailId, Date.now());
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

async function handleCreateDraft(
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

  return jsonResult({
    success: true,
    draftId: draft.data.id,
    threadId: original.data.threadId,
    message: "Draft created successfully. Review and send from Gmail.",
  });
}

/**
 * Attempts to remove the In-Progress label from an email and release the
 * processing lock.  This is called on the error path of handleMarkProcessed
 * (and potentially other handlers) when the main Gmail API call throws, to
 * avoid leaving an email stuck with In-Progress label indefinitely.
 *
 * Never throws — always returns a status string so the caller can include it
 * in the errorResult message.
 */
async function cleanupInProgress(emailId: string, gmail: gmail_v1.Gmail): Promise<string> {
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
    processingLocks.delete(emailId);
    return "cleanup succeeded";
  } catch (cleanupError) {
    processingLocks.delete(emailId);
    const msg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
    return `cleanup failed: ${msg}`;
  }
}

async function handleMarkProcessed(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { emailId, action, actor, prepaymentProvider } = markProcessedSchema.parse(args);

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
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
      if (draftedLabelId) {
        addLabelIds.push(draftedLabelId);
      }
      break;
    }
    case "skipped": {
      const skippedLabelId = labelMap.get(LABELS.PROCESSED_SKIPPED);
      if (skippedLabelId) {
        addLabelIds.push(skippedLabelId);
      }
      break;
    }
    case "acknowledged": {
      const acknowledgedLabelId = labelMap.get(LABELS.PROCESSED_ACKNOWLEDGED);
      if (acknowledgedLabelId) {
        addLabelIds.push(acknowledgedLabelId);
      }
      break;
    }
    case "spam": {
      const spamLabelId = labelMap.get(LABELS.SPAM);
      if (spamLabelId) {
        addLabelIds.push(spamLabelId);
      }
      addLabelIds.push("SPAM");
      break;
    }
    case "promotional": {
      const promoLabelId = labelMap.get(LABELS.PROMOTIONAL);
      if (promoLabelId) {
        addLabelIds.push(promoLabelId);
      }
      removeLabelIds.push("INBOX");
      break;
    }
    case "deferred": {
      const deferredLabelId = labelMap.get(LABELS.DEFERRED);
      if (deferredLabelId) {
        addLabelIds.push(deferredLabelId);
      }
      break;
    }
    case "requeued": {
      const queueLabelId = labelMap.get(LABELS.NEEDS_PROCESSING);
      if (queueLabelId) {
        addLabelIds.push(queueLabelId);
      }
      break;
    }
    case "awaiting_agreement": {
      const awaitingLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (awaitingLabelId) {
        addLabelIds.push(awaitingLabelId);
      }
      break;
    }
    case "agreement_received": {
      const agreementLabelId = labelMap.get(LABELS.WORKFLOW_AGREEMENT_RECEIVED);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) {
        addLabelIds.push(decisionLabelId);
      }
      if (agreementLabelId) {
        addLabelIds.push(agreementLabelId);
      }
      break;
    }
    case "prepayment_chase_1": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_1);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) {
        addLabelIds.push(decisionLabelId);
      }
      if (chaseLabelId) {
        addLabelIds.push(chaseLabelId);
      }
      break;
    }
    case "prepayment_chase_2": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_2);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) {
        addLabelIds.push(decisionLabelId);
      }
      if (chaseLabelId) {
        addLabelIds.push(chaseLabelId);
      }
      break;
    }
    case "prepayment_chase_3": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_3);
      const decisionLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      if (decisionLabelId) {
        addLabelIds.push(decisionLabelId);
      }
      if (chaseLabelId) {
        addLabelIds.push(chaseLabelId);
      }
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
  processingLocks.delete(emailId);
  appendAuditEntry({ ts: new Date().toISOString(), messageId: emailId, action: "outcome", actor, result: action });

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

async function handleMigrateLabels(
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
      if (messages.length === 0) {
        break;
      }

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

      if (!response.data.nextPageToken || messages.length < pageSize) {
        break;
      }
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

async function handleReconcileInProgress(
  gmail: gmail_v1.Gmail,
  args: unknown
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
      await handleMarkProcessed(gmail, {
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

// =============================================================================
// Tool Handler
// =============================================================================

export async function handleGmailTool(name: string, args: unknown) {
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
      case "gmail_organize_inbox": {
        return await handleOrganizeInbox(gmail, args);
      }

      case "gmail_list_pending": {
        return await handleListPending(gmail, args);
      }

      case "gmail_list_query": {
        return await handleListQuery(gmail, args);
      }

      case "gmail_get_email": {
        return await handleGetEmail(gmail, args);
      }

      case "gmail_create_draft": {
        return await handleCreateDraft(gmail, args);
      }

      case "gmail_mark_processed": {
        return await handleMarkProcessed(gmail, args);
      }

      case "gmail_migrate_labels": {
        return await handleMigrateLabels(gmail, args);
      }

      case "gmail_reconcile_in_progress": {
        return await handleReconcileInProgress(gmail, args);
      }

      default:
        return errorResult(`Unknown gmail tool: ${name}`);
    }
  } catch (error) {
    // Handle Gmail API specific errors
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
