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
  appendTelemetryEvent,
  applyDraftOutcomeLabelsStrict,
} from "./gmail-shared.js";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const ACTOR_VALUES = ["human", "claude", "codex"] as const;
type OutboundActor = (typeof ACTOR_VALUES)[number];

const processOutboundDraftsSchema = z.object({
  firebaseUrl: z.string().url(),
  firebaseApiKey: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  actor: z.enum(ACTOR_VALUES).optional().default("human"),
});

// ---------------------------------------------------------------------------
// Firebase outbound draft record (mirrors Prime's OutboundDraftRecord)
// ---------------------------------------------------------------------------

const outboundDraftRecordSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  bodyText: z.string().min(1),
  category: z.enum(["pre-arrival", "extension-ops"]),
  guestName: z.string().optional(),
  bookingCode: z.string().optional(),
  eventId: z.string().optional(),
  status: z.enum(["pending", "processing", "drafted", "sent", "failed"]),
  createdAt: z.string().datetime(),
  processingStartedAt: z.string().optional(),
  draftId: z.string().optional(),
  gmailMessageId: z.string().optional(),
  draftedAt: z.string().optional(),
  failedAt: z.string().optional(),
  error: z.string().optional(),
});

type OutboundDraftRecord = z.infer<typeof outboundDraftRecordSchema>;

interface FirebaseOptions {
  url: string;
  apiKey?: string;
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

interface InvalidOutboundRecord {
  id: string;
  error: string;
}

interface ProcessingReconcileEntry {
  id: string;
  record: OutboundDraftRecord;
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

function categoryToOutcomeCategory(
  category: OutboundDraftRecord["category"],
): "pre-arrival" | "operations" {
  switch (category) {
    case "pre-arrival":
      return "pre-arrival";
    case "extension-ops":
      return "operations";
    default:
      return "operations";
  }
}

function parseTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// ---------------------------------------------------------------------------
// Core processing
// ---------------------------------------------------------------------------

async function processOneDraft(
  id: string,
  record: OutboundDraftRecord,
  gmail: gmail_v1.Gmail,
  firebase: FirebaseOptions,
  actor: OutboundActor = "human",
): Promise<ProcessedDraftResult> {
  const nowIso = new Date().toISOString();
  try {
    await firebasePatch(
      firebase.url,
      `outboundDrafts/${id}`,
      {
        status: "processing",
        processingStartedAt: nowIso,
        error: null,
      },
      firebase.apiKey,
    );

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

    await firebasePatch(
      firebase.url,
      `outboundDrafts/${id}`,
      {
        status: "processing",
        processingStartedAt: nowIso,
        draftId,
        gmailMessageId,
      },
      firebase.apiKey,
    );

    await applyDraftOutcomeLabelsStrict(gmail, {
      draftMessageId: gmailMessageId ?? "",
      sourcePath: "outbound",
      actor,
      outboundCategory: categoryToOutcomeCategory(record.category),
      toolName: "prime_process_outbound_drafts",
    });

    appendTelemetryEvent({
      ts: nowIso,
      event_key: "email_draft_created",
      source_path: "outbound",
      actor,
      tool_name: "prime_process_outbound_drafts",
      message_id: gmailMessageId ?? null,
      draft_id: draftId ?? null,
    });

    // Update Firebase record
    await firebasePatch(
      firebase.url,
      `outboundDrafts/${id}`,
      {
        status: "drafted",
        draftId,
        gmailMessageId,
        draftedAt: nowIso,
        failedAt: null,
        error: null,
      },
      firebase.apiKey,
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
        firebase.url,
        `outboundDrafts/${id}`,
        {
          status: "failed",
          failedAt: nowIso,
          error: errorMessage,
        },
        firebase.apiKey,
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

async function reconcileExistingDraft(
  id: string,
  record: OutboundDraftRecord,
  gmail: gmail_v1.Gmail,
  firebase: FirebaseOptions,
  actor: OutboundActor = "human",
): Promise<ProcessedDraftResult> {
  const nowIso = new Date().toISOString();
  const draftId = record.draftId?.trim() || undefined;

  if (!draftId) {
    const error = "Missing draftId for processing reconciliation.";
    try {
      await firebasePatch(
        firebase.url,
        `outboundDrafts/${id}`,
        {
          status: "failed",
          failedAt: nowIso,
          error,
        },
        firebase.apiKey,
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
      error,
    };
  }

  try {
    const draft = await gmail.users.drafts.get({
      userId: "me",
      id: draftId,
    });
    const gmailMessageId = draft.data?.message?.id || record.gmailMessageId || undefined;

    await applyDraftOutcomeLabelsStrict(gmail, {
      draftMessageId: gmailMessageId ?? "",
      sourcePath: "outbound",
      actor,
      outboundCategory: categoryToOutcomeCategory(record.category),
      toolName: "prime_process_outbound_drafts",
    });

    await firebasePatch(
      firebase.url,
      `outboundDrafts/${id}`,
      {
        status: "drafted",
        draftId,
        gmailMessageId,
        draftedAt: nowIso,
        failedAt: null,
        error: null,
      },
      firebase.apiKey,
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
        firebase.url,
        `outboundDrafts/${id}`,
        {
          status: "failed",
          failedAt: nowIso,
          error: `Failed draft reconciliation: ${errorMessage}`,
        },
        firebase.apiKey,
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
      error: `Failed draft reconciliation: ${errorMessage}`,
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
        actor: {
          type: "string",
          enum: ["human", "claude", "codex"],
          description:
            "The actor responsible for drafting. Determines the Agent/* label applied. Defaults to 'human'.",
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
  const { firebaseUrl, firebaseApiKey, dryRun, actor } =
    processOutboundDraftsSchema.parse(args);
  const nowMs = Date.now();
  const staleProcessingMs = 20 * 60 * 1000;

  // Fetch all outbound drafts from Firebase
  const allDrafts = await firebaseGet<Record<string, unknown>>(
    firebaseUrl,
    "outboundDrafts",
    firebaseApiKey,
  );

  if (!allDrafts) {
    return jsonResult({ processed: 0, message: "No outbound drafts found." });
  }

  // Validate each record and filter to pending only.
  const invalidRecords: InvalidOutboundRecord[] = [];
  const pendingEntries: Array<[string, OutboundDraftRecord]> = [];
  const processingReconcileEntries: ProcessingReconcileEntry[] = [];
  for (const [id, rawRecord] of Object.entries(allDrafts)) {
    const parsed = outboundDraftRecordSchema.safeParse(rawRecord);
    if (!parsed.success) {
      const validationError = parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "record"}: ${issue.message}`)
        .join("; ");
      invalidRecords.push({
        id,
        error: validationError,
      });

      const invalidRecordStatus =
        rawRecord && typeof rawRecord === "object" && "status" in rawRecord
          ? (rawRecord as { status?: unknown }).status
          : null;

      // Non-dry runs should transition invalid records out of pending to avoid
      // repeated retries on every execution.
      if (!dryRun && invalidRecordStatus === "pending") {
        try {
          await firebasePatch(
            firebaseUrl,
            `outboundDrafts/${id}`,
            {
              status: "failed",
              error: `Invalid outbound draft record: ${validationError}`,
            },
            firebaseApiKey,
          );
        } catch {
          // Best-effort status update
        }
      }

      continue;
    }

    if (parsed.data.status === "pending") {
      pendingEntries.push([id, parsed.data]);
      continue;
    }

    if (parsed.data.status === "processing") {
      const processingStartedAt =
        parseTimestamp(parsed.data.processingStartedAt) ??
        parseTimestamp(parsed.data.createdAt);
      const isStale =
        processingStartedAt === null ||
        nowMs - processingStartedAt >= staleProcessingMs;

      if (!isStale) {
        continue;
      }

      if (parsed.data.draftId || parsed.data.gmailMessageId) {
        processingReconcileEntries.push({ id, record: parsed.data });
        continue;
      }

      if (!dryRun) {
        try {
          await firebasePatch(
            firebaseUrl,
            `outboundDrafts/${id}`,
            {
              status: "pending",
              error: "Recovered stale processing state for retry.",
            },
            firebaseApiKey,
          );
        } catch {
          continue;
        }
      }

      pendingEntries.push([id, { ...parsed.data, status: "pending" }]);
    }
  }

  if (pendingEntries.length === 0 && processingReconcileEntries.length === 0) {
    return jsonResult({
      processed: 0,
      total: Object.keys(allDrafts).length,
      invalidRecords,
      message:
        invalidRecords.length > 0
          ? "No processable outbound drafts after filtering invalid records."
          : "No processable outbound drafts.",
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
      processingReconcile: processingReconcileEntries.map(({ id, record }) => ({
        id,
        category: record.category,
        draftId: record.draftId ?? null,
        gmailMessageId: record.gmailMessageId ?? null,
        processingStartedAt: record.processingStartedAt ?? null,
      })),
      total: Object.keys(allDrafts).length,
      invalidRecords,
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

  // Process each pending draft sequentially
  const results: ProcessedDraftResult[] = [];
  for (const { id, record } of processingReconcileEntries) {
    const result = await reconcileExistingDraft(
      id,
      record,
      gmail,
      { url: firebaseUrl, apiKey: firebaseApiKey },
      actor,
    );
    results.push(result);
  }
  for (const [id, record] of pendingEntries) {
    const result = await processOneDraft(
      id,
      record,
      gmail,
      { url: firebaseUrl, apiKey: firebaseApiKey },
      actor,
    );
    results.push(result);
  }

  const drafted = results.filter((r) => r.status === "drafted").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return jsonResult({
    processed: results.length,
    drafted,
    failed,
    invalidRecords,
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
