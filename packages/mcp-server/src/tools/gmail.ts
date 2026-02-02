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
import {
  errorResult,
  formatError,
  jsonResult,
} from "../utils/validation.js";

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
  READY_FOR_REVIEW: "Brikette/Drafts/Ready-For-Review",
  SENT: "Brikette/Drafts/Sent",
  PROMOTIONAL: "Brikette/Promotional",
} as const;

// =============================================================================
// Zod Schemas
// =============================================================================

const listPendingSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(20),
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
  action: z.enum(["drafted", "skipped", "spam", "deferred", "acknowledged", "promotional"]),
});

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
        action: {
          type: "string",
          enum: ["drafted", "skipped", "spam", "deferred", "acknowledged", "promotional"],
          description: "How the email was handled: drafted (draft created), skipped (no response needed), spam (mark as spam), deferred (keep for later), acknowledged (informational email - no reply needed but noted), promotional (marketing/newsletter - archive for batch review)",
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
async function getLabelId(
  gmail: gmail_v1.Gmail,
  labelName: string
): Promise<string | null> {
  try {
    const response = await gmail.users.labels.list({ userId: "me" });
    const labels = response.data.labels || [];
    const label = labels.find((l: gmail_v1.Schema$Label) => l.name === labelName);
    return label?.id || null;
  } catch {
    return null;
  }
}

/**
 * Create RFC 2822 formatted email for draft
 */
function createRawEmail(
  to: string,
  subject: string,
  bodyPlain: string,
  bodyHtml?: string,
  inReplyTo?: string,
  references?: string
): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  const headers = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    headers.push(`References: ${references}`);
  }

  let body: string;

  if (bodyHtml) {
    // Multipart message with both plain and HTML
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      ``,
      bodyPlain,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      ``,
      bodyHtml,
      ``,
      `--${boundary}--`,
    ].join("\r\n");
  } else {
    // Plain text only
    headers.push(`Content-Type: text/plain; charset="UTF-8"`);
    body = bodyPlain;
  }

  const message = headers.join("\r\n") + "\r\n\r\n" + body;

  // Encode to URL-safe base64
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// =============================================================================
// Tool Handler
// =============================================================================

// eslint-disable-next-line complexity
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
        const { limit } = listPendingSchema.parse(args);

        // Get the "Needs-Processing" label ID
        const labelId = await getLabelId(gmail, LABELS.NEEDS_PROCESSING);
        if (!labelId) {
          return errorResult(
            `Label "${LABELS.NEEDS_PROCESSING}" not found in Gmail. ` +
            `Please create the Brikette label hierarchy first:\n` +
            `- Brikette/Inbox/Needs-Processing\n` +
            `- Brikette/Inbox/Processing\n` +
            `- Brikette/Drafts/Ready-For-Review\n` +
            `- Brikette/Drafts/Sent`
          );
        }

        // List messages with the label
        const response = await gmail.users.messages.list({
          userId: "me",
          labelIds: [labelId],
          maxResults: limit,
        });

        const messages = response.data.messages || [];
        const emails: PendingEmail[] = [];

        // Fetch details for each message
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

          // Get thread to check if this is a reply
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

      case "gmail_get_email": {
        const { emailId, includeThread } = getEmailSchema.parse(args);

        // Get full message
        const response = await gmail.users.messages.get({
          userId: "me",
          id: emailId,
          format: "full",
        });

        const msg = response.data;
        if (!msg.id) {
          return errorResult(`Email not found: ${emailId}`);
        }

        const headers = (msg.payload?.headers || []) as EmailHeader[];
        const from = parseEmailAddress(getHeader(headers, "From"));
        const subject = getHeader(headers, "Subject") || "(no subject)";
        const dateStr = getHeader(headers, "Date");
        const messageId = getHeader(headers, "Message-ID");

        // Extract body content
        const body = extractBody(msg.payload as Parameters<typeof extractBody>[0]);

        // Extract attachments
        const attachments = extractAttachments(msg.payload as Parameters<typeof extractAttachments>[0]);

        // Get thread context if requested
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
                .filter(m => m.id !== emailId) // Exclude current message
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

        // Include Message-ID for threading replies
        return jsonResult({
          ...emailDetails,
          messageId,
        });
      }

      case "gmail_create_draft": {
        const { emailId, subject, bodyPlain, bodyHtml } = createDraftSchema.parse(args);

        // Get the original email to get reply details
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

        // Build references header for threading
        const references = existingRefs
          ? `${existingRefs} ${messageId}`
          : messageId;

        // Create raw email
        const raw = createRawEmail(
          from,
          subject,
          bodyPlain,
          bodyHtml,
          messageId,
          references
        );

        // Create draft in the same thread
        const draft = await gmail.users.drafts.create({
          userId: "me",
          requestBody: {
            message: {
              raw,
              threadId: original.data.threadId,
            },
          },
        });

        // Try to add "Ready-For-Review" label to the draft
        const reviewLabelId = await getLabelId(gmail, LABELS.READY_FOR_REVIEW);
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

      case "gmail_mark_processed": {
        const { emailId, action } = markProcessedSchema.parse(args);

        // Get label IDs
        const needsProcessingId = await getLabelId(gmail, LABELS.NEEDS_PROCESSING);
        const processingId = await getLabelId(gmail, LABELS.PROCESSING);

        // Determine label changes based on action
        const addLabelIds: string[] = [];
        const removeLabelIds: string[] = [];

        // Always remove from queue
        if (needsProcessingId) {
          removeLabelIds.push(needsProcessingId);
        }
        if (processingId) {
          removeLabelIds.push(processingId);
        }

        switch (action) {
          case "drafted":
            // Draft created - labels updated by gmail_create_draft
            break;
          case "skipped":
            // Just remove from queue (already done above)
            break;
          case "acknowledged":
            // Informational email - no reply needed but we noted the content
            // Remove from queue (already done above), no additional labels
            break;
          case "spam":
            // Move to spam
            addLabelIds.push("SPAM");
            break;
          case "promotional": {
            // Archive and label for batch review/deletion later
            const promoLabelId = await getLabelId(gmail, LABELS.PROMOTIONAL);
            if (promoLabelId) {
              addLabelIds.push(promoLabelId);
            }
            // Remove from inbox (archive)
            removeLabelIds.push("INBOX");
            break;
          }
          case "deferred":
            // Put back in queue for later
            if (needsProcessingId) {
              removeLabelIds.pop(); // Don't remove needs-processing
            }
            break;
        }

        // Apply label changes
        await gmail.users.messages.modify({
          userId: "me",
          id: emailId,
          requestBody: {
            addLabelIds: addLabelIds.length > 0 ? addLabelIds : undefined,
            removeLabelIds: removeLabelIds.length > 0 ? removeLabelIds : undefined,
          },
        });

        return jsonResult({
          success: true,
          message: `Email marked as ${action}`,
          action,
        });
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
