/**
 * MCP Tool: prime_process_outbound_drafts
 *
 * Phase 2 of the human-in-the-loop email workflow.
 * Reads pending outbound draft records from Firebase, creates labelled Gmail
 * drafts for human review, and updates the Firebase record status.
 */

import type { gmail_v1 } from "googleapis";
import { z } from "zod";

import { getGmailClient } from "../clients/gmail.js";
import { createRawEmail } from "../utils/email-mime.js";
import { generateEmailHtml } from "../utils/email-template.js";
import { errorResult, formatError, jsonResult } from "../utils/validation.js";

import {
  collectLabelIds,
  ensureLabelMap,
  LABELS,
  REQUIRED_LABELS,
} from "./gmail.js";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const processOutboundDraftsSchema = z.object({
  firebaseUrl: z.string().url(),
  firebaseApiKey: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// Firebase outbound draft record (mirrors Prime's OutboundDraftRecord)
// ---------------------------------------------------------------------------

interface OutboundDraftRecord {
  to: string;
  subject: string;
  bodyText: string;
  category: "pre-arrival" | "extension-ops";
  guestName?: string;
  bookingCode?: string;
  eventId?: string;
  status: "pending" | "drafted" | "sent" | "failed";
  createdAt: string;
  draftId?: string;
  gmailMessageId?: string;
  draftedAt?: string;
  error?: string;
}

interface ProcessedDraftResult {
  id: string;
  to: string;
  subject: string;
  category: string;
  draftId?: string;
  gmailMessageId?: string;
  status: "drafted" | "failed";
  error?: string;
}

// ---------------------------------------------------------------------------
// Firebase REST helpers (minimal — no SDK dependency)
// ---------------------------------------------------------------------------

function buildFirebaseUrl(
  baseUrl: string,
  path: string,
  apiKey?: string,
): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${baseUrl}${cleanPath}.json`);
  if (apiKey) {
    url.searchParams.set("auth", apiKey);
  }
  return url.toString();
}

async function firebaseGet<T>(
  baseUrl: string,
  path: string,
  apiKey?: string,
): Promise<T | null> {
  const url = buildFirebaseUrl(baseUrl, path, apiKey);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Firebase GET ${path}: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as T | null;
}

async function firebasePatch(
  baseUrl: string,
  path: string,
  data: Record<string, unknown>,
  apiKey?: string,
): Promise<void> {
  const url = buildFirebaseUrl(baseUrl, path, apiKey);
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Firebase PATCH ${path}: ${response.status} ${response.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// Label resolution per category
// ---------------------------------------------------------------------------

function categoryToLabelNames(category: string): string[] {
  const labels: string[] = [LABELS.READY_FOR_REVIEW];
  switch (category) {
    case "pre-arrival":
      labels.push(LABELS.OUTBOUND_PRE_ARRIVAL);
      break;
    case "extension-ops":
      labels.push(LABELS.OUTBOUND_OPERATIONS);
      break;
  }
  return labels;
}

// ---------------------------------------------------------------------------
// Core processing
// ---------------------------------------------------------------------------

async function processOneDraft(
  id: string,
  record: OutboundDraftRecord,
  gmail: gmail_v1.Gmail,
  labelMap: Map<string, string>,
  firebaseUrl: string,
  firebaseApiKey?: string,
): Promise<ProcessedDraftResult> {
  try {
    const bodyHtml = generateEmailHtml({
      bodyText: record.bodyText,
      includeBookingLink: false,
      subject: record.subject,
    });

    const raw = createRawEmail(record.to, record.subject, record.bodyText, bodyHtml);

    const draft = await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { raw } },
    });

    const draftId = draft.data?.id || undefined;
    const gmailMessageId = draft.data?.message?.id || undefined;

    // Apply labels to the draft message
    if (gmailMessageId) {
      const labelNames = categoryToLabelNames(record.category);
      const labelIds = collectLabelIds(labelMap, labelNames);
      if (labelIds.length > 0) {
        try {
          await gmail.users.messages.modify({
            userId: "me",
            id: gmailMessageId,
            requestBody: { addLabelIds: labelIds },
          });
        } catch {
          // Label application is best-effort
        }
      }
    }

    // Update Firebase record
    await firebasePatch(
      firebaseUrl,
      `outboundDrafts/${id}`,
      {
        status: "drafted",
        draftId,
        gmailMessageId,
        draftedAt: new Date().toISOString(),
      },
      firebaseApiKey,
    );

    return {
      id,
      to: record.to,
      subject: record.subject,
      category: record.category,
      draftId,
      gmailMessageId,
      status: "drafted",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      await firebasePatch(
        firebaseUrl,
        `outboundDrafts/${id}`,
        { status: "failed", error: errorMessage },
        firebaseApiKey,
      );
    } catch {
      // Best-effort status update
    }

    return {
      id,
      to: record.to,
      subject: record.subject,
      category: record.category,
      status: "failed",
      error: errorMessage,
    };
  }
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const outboundDraftTools = [
  {
    name: "prime_process_outbound_drafts",
    description:
      "Process pending outbound email drafts from Prime's Firebase outbox. " +
      "Reads pending records, creates labelled Gmail drafts for human review, " +
      "and updates the Firebase record status.",
    inputSchema: {
      type: "object",
      properties: {
        firebaseUrl: {
          type: "string",
          description:
            "Firebase Realtime Database URL (e.g. https://prime-f3652-default-rtdb.europe-west1.firebasedatabase.app)",
        },
        firebaseApiKey: {
          type: "string",
          description: "Optional Firebase API key for auth",
        },
        dryRun: {
          type: "boolean",
          description: "If true, list pending drafts without creating Gmail drafts",
        },
      },
      required: ["firebaseUrl"],
    },
  },
] as const;

// ---------------------------------------------------------------------------
// Tool handler
// ---------------------------------------------------------------------------

async function handleProcessOutboundDrafts(args: unknown) {
  const { firebaseUrl, firebaseApiKey, dryRun } =
    processOutboundDraftsSchema.parse(args);

  // Fetch all outbound drafts from Firebase
  const allDrafts = await firebaseGet<Record<string, OutboundDraftRecord>>(
    firebaseUrl,
    "outboundDrafts",
    firebaseApiKey,
  );

  if (!allDrafts) {
    return jsonResult({ processed: 0, message: "No outbound drafts found." });
  }

  // Filter to pending only
  const pendingEntries = Object.entries(allDrafts).filter(
    ([, record]) => record.status === "pending",
  );

  if (pendingEntries.length === 0) {
    return jsonResult({
      processed: 0,
      total: Object.keys(allDrafts).length,
      message: "No pending outbound drafts.",
    });
  }

  if (dryRun) {
    return jsonResult({
      dryRun: true,
      pending: pendingEntries.map(([id, record]) => ({
        id,
        to: record.to,
        subject: record.subject,
        category: record.category,
        createdAt: record.createdAt,
      })),
      total: Object.keys(allDrafts).length,
    });
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
          `3. Run: cd packages/mcp-server && pnpm gmail:auth`,
      );
    }
    return errorResult(clientResult.error);
  }

  const gmail = clientResult.client;
  const labelMap = await ensureLabelMap(gmail, REQUIRED_LABELS);

  // Process each pending draft sequentially
  const results: ProcessedDraftResult[] = [];
  for (const [id, record] of pendingEntries) {
    const result = await processOneDraft(
      id,
      record,
      gmail,
      labelMap,
      firebaseUrl,
      firebaseApiKey,
    );
    results.push(result);
  }

  const drafted = results.filter((r) => r.status === "drafted").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return jsonResult({
    processed: results.length,
    drafted,
    failed,
    results,
  });
}

export async function handleOutboundDraftTool(name: string, args: unknown) {
  try {
    switch (name) {
      case "prime_process_outbound_drafts":
        return handleProcessOutboundDrafts(args);
      default:
        return errorResult(`Unknown outbound draft tool: ${name}`);
    }
  } catch (error) {
    return errorResult(formatError(error));
  }
}
