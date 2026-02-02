/**
 * Gmail MCP Tools for Brikette Email Processing
 *
 * Four tools for email workflow:
 * - gmail_list_pending: List emails needing response
 * - gmail_get_email: Get full email details with thread context
 * - gmail_create_draft: Create a draft reply
 * - gmail_mark_processed: Update email queue status via labels
 */

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

import { getGmailClient } from "../clients/gmail.js";
import { createRawEmail } from "../utils/email-mime.js";
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

// =============================================================================
// Constants
// =============================================================================

/**
 * Gmail label names for Brikette email workflow
 * These must be created manually in Gmail before use
 */
const LABELS = {
  NEEDS_PROCESSING: "Brikette/Inbox/Needs-Processing",
  PROCESSING: "Brikette/Inbox/Processing",
  AWAITING_AGREEMENT: "Brikette/Inbox/Awaiting-Agreement",
  DEFERRED: "Brikette/Inbox/Deferred",
  READY_FOR_REVIEW: "Brikette/Drafts/Ready-For-Review",
  SENT: "Brikette/Drafts/Sent",
  PROCESSED_DRAFTED: "Brikette/Processed/Drafted",
  PROCESSED_ACKNOWLEDGED: "Brikette/Processed/Acknowledged",
  PROCESSED_SKIPPED: "Brikette/Processed/Skipped",
  WORKFLOW_PREPAYMENT_CHASE_1: "Brikette/Workflow/Prepayment-Chase-1",
  WORKFLOW_PREPAYMENT_CHASE_2: "Brikette/Workflow/Prepayment-Chase-2",
  WORKFLOW_PREPAYMENT_CHASE_3: "Brikette/Workflow/Prepayment-Chase-3",
  WORKFLOW_AGREEMENT_RECEIVED: "Brikette/Workflow/Agreement-Received",
  PROMOTIONAL: "Brikette/Promotional",
  SPAM: "Brikette/Spam",
} as const;

const REQUIRED_LABELS = [
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
  LABELS.PROMOTIONAL,
  LABELS.SPAM,
];

const PROCESSING_TIMEOUT_MS = 30 * 60 * 1000;
const processingLocks = new Map<string, number>();

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
    "acknowledged",
    "promotional",
    "awaiting_agreement",
    "agreement_received",
    "prepayment_chase_1",
    "prepayment_chase_2",
    "prepayment_chase_3",
  ]),
  prepaymentProvider: z.enum(["octorate", "hostelworld"]).optional(),
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
    name: "gmail_list_pending",
    description: "List customer emails in the Brikette inbox that need responses. Returns emails with the 'Brikette/Inbox/Needs-Processing' label.",
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
        action: {
          type: "string",
          enum: [
            "drafted",
            "skipped",
            "spam",
            "deferred",
            "acknowledged",
            "promotional",
            "awaiting_agreement",
            "agreement_received",
            "prepayment_chase_1",
            "prepayment_chase_2",
            "prepayment_chase_3",
          ],
          description: "How the email was handled: drafted (draft created), skipped (no response needed), spam (mark as spam), deferred (pause processing), acknowledged (informational email - no reply needed but noted), promotional (marketing/newsletter - archive for batch review), awaiting_agreement (T&C reply needed), agreement_received (T&C confirmed), prepayment_chase_1/2/3 (payment reminders).",
        },
      },
      required: ["emailId", "action"],
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
async function ensureLabelMap(
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

function collectLabelIds(
  labelMap: Map<string, string>,
  labelNames: string[]
): string[] {
  return labelNames
    .map(labelName => labelMap.get(labelName))
    .filter((labelId): labelId is string => !!labelId);
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

// =============================================================================
// Tool Case Handlers
// =============================================================================

async function handleListPending(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult> | ReturnType<typeof errorResult>> {
  const { limit } = listPendingSchema.parse(args);

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const labelId = labelMap.get(LABELS.NEEDS_PROCESSING);
  if (!labelId) {
    return errorResult(
      `Label "${LABELS.NEEDS_PROCESSING}" not found in Gmail. ` +
      `Please create the Brikette label hierarchy first.`
    );
  }

  const response = await gmail.users.messages.list({
    userId: "me",
    labelIds: [labelId],
    maxResults: limit,
  });

  const messages = response.data.messages || [];
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
    hasMore: messages.length === limit,
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
  const { emailId, includeThread } = getEmailSchema.parse(args);

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
  const processingLabelId = labelMap.get(LABELS.PROCESSING);
  const needsProcessingLabelId = labelMap.get(LABELS.NEEDS_PROCESSING);

  if (!processingLabelId) {
    return errorResult(`Label "${LABELS.PROCESSING}" not found in Gmail.`);
  }

  const messageLabelIds = msg.labelIds || [];
  if (messageLabelIds.includes(processingLabelId)) {
    const isStale = isProcessingLockStale(
      processingLocks.get(emailId),
      msg.internalDate
    );
    if (isStale) {
      await gmail.users.messages.modify({
        userId: "me",
        id: emailId,
        requestBody: {
          removeLabelIds: [processingLabelId],
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
      addLabelIds: [processingLabelId],
      removeLabelIds: needsProcessingLabelId ? [needsProcessingLabelId] : undefined,
    },
  });
  processingLocks.set(emailId, Date.now());

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

async function handleMarkProcessed(
  gmail: gmail_v1.Gmail,
  args: unknown
): Promise<ReturnType<typeof jsonResult>> {
  const { emailId, action, prepaymentProvider } = markProcessedSchema.parse(args);

  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);
  const needsProcessingId = labelMap.get(LABELS.NEEDS_PROCESSING);
  const processingId = labelMap.get(LABELS.PROCESSING);
  const workflowLabelIds = collectLabelIds(labelMap, [
    LABELS.WORKFLOW_PREPAYMENT_CHASE_1,
    LABELS.WORKFLOW_PREPAYMENT_CHASE_2,
    LABELS.WORKFLOW_PREPAYMENT_CHASE_3,
    LABELS.WORKFLOW_AGREEMENT_RECEIVED,
  ]);
  const processedLabelIds = collectLabelIds(labelMap, [
    LABELS.PROCESSED_DRAFTED,
    LABELS.PROCESSED_ACKNOWLEDGED,
    LABELS.PROCESSED_SKIPPED,
  ]);
  const inboxStateLabelIds = collectLabelIds(labelMap, [
    LABELS.AWAITING_AGREEMENT,
    LABELS.DEFERRED,
  ]);

  const addLabelIds: string[] = [];
  const removeLabelIds: string[] = [];

  if (needsProcessingId) {
    removeLabelIds.push(needsProcessingId);
  }
  if (processingId) {
    removeLabelIds.push(processingId);
  }

  switch (action) {
    case "drafted": {
      const draftedLabelId = labelMap.get(LABELS.PROCESSED_DRAFTED);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (draftedLabelId) {
        addLabelIds.push(draftedLabelId);
      }
      break;
    }
    case "skipped": {
      const skippedLabelId = labelMap.get(LABELS.PROCESSED_SKIPPED);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (skippedLabelId) {
        addLabelIds.push(skippedLabelId);
      }
      break;
    }
    case "acknowledged": {
      const acknowledgedLabelId = labelMap.get(LABELS.PROCESSED_ACKNOWLEDGED);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (acknowledgedLabelId) {
        addLabelIds.push(acknowledgedLabelId);
      }
      break;
    }
    case "spam": {
      const spamLabelId = labelMap.get(LABELS.SPAM);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (spamLabelId) {
        addLabelIds.push(spamLabelId);
      }
      addLabelIds.push("SPAM");
      break;
    }
    case "promotional": {
      const promoLabelId = labelMap.get(LABELS.PROMOTIONAL);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (promoLabelId) {
        addLabelIds.push(promoLabelId);
      }
      removeLabelIds.push("INBOX");
      break;
    }
    case "deferred": {
      const deferredLabelId = labelMap.get(LABELS.DEFERRED);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds);
      removeLabelIds.push(...collectLabelIds(labelMap, [LABELS.AWAITING_AGREEMENT]));
      if (deferredLabelId) {
        addLabelIds.push(deferredLabelId);
      }
      break;
    }
    case "awaiting_agreement": {
      const awaitingLabelId = labelMap.get(LABELS.AWAITING_AGREEMENT);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (awaitingLabelId) {
        addLabelIds.push(awaitingLabelId);
      }
      break;
    }
    case "agreement_received": {
      const agreementLabelId = labelMap.get(LABELS.WORKFLOW_AGREEMENT_RECEIVED);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (agreementLabelId) {
        addLabelIds.push(agreementLabelId);
      }
      break;
    }
    case "prepayment_chase_1": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_1);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (chaseLabelId) {
        addLabelIds.push(chaseLabelId);
      }
      break;
    }
    case "prepayment_chase_2": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_2);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (chaseLabelId) {
        addLabelIds.push(chaseLabelId);
      }
      break;
    }
    case "prepayment_chase_3": {
      const chaseLabelId = labelMap.get(LABELS.WORKFLOW_PREPAYMENT_CHASE_3);
      removeLabelIds.push(...processedLabelIds, ...workflowLabelIds, ...inboxStateLabelIds);
      if (chaseLabelId) {
        addLabelIds.push(chaseLabelId);
      }
      break;
    }
  }

  const uniqueAddLabelIds = Array.from(new Set(addLabelIds));
  const uniqueRemoveLabelIds = Array.from(new Set(removeLabelIds));

  await gmail.users.messages.modify({
    userId: "me",
    id: emailId,
    requestBody: {
      addLabelIds: uniqueAddLabelIds.length > 0 ? uniqueAddLabelIds : undefined,
      removeLabelIds: uniqueRemoveLabelIds.length > 0 ? uniqueRemoveLabelIds : undefined,
    },
  });
  processingLocks.delete(emailId);

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
    workflow,
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
        `3. Run: cd packages/mcp-server && node --loader ts-node/esm test-gmail-auth.ts`
      );
    }
    return errorResult(clientResult.error);
  }

  const gmail = clientResult.client;

  try {
    switch (name) {
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
        `Run: cd packages/mcp-server && node --loader ts-node/esm test-gmail-auth.ts\n` +
        `(Error: ${err.message || "Auth failed"})`
      );
    }
    return errorResult(formatError(error));
  }
}
