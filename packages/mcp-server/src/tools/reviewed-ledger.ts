import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as nodePath from "node:path";

import type { EmailSourcePath } from "./gmail.js";

export type ReviewedLedgerReviewState = "new" | "approved" | "rejected" | "deferred";
export type ReviewedLedgerPromotionStatus = "active" | "reverted";

export interface ReviewedLedgerHistoryEvent {
  at: string;
  event: "created" | "state_transition" | "promoted" | "promotion_idempotent" | "reverted";
  details: Record<string, string>;
}

export interface ReviewedLedgerEntry {
  entry_id: string;
  created_at: string;
  updated_at: string;
  verdict: ReviewedLedgerReviewState;
  review_state: ReviewedLedgerReviewState;
  question_hash: string;
  question: string;
  drafted_answer: string;
  source_path: EmailSourcePath;
  scenario_category: string;
  language: string;
  context_excerpt: string;
  promotion: {
    key: string | null;
    status: ReviewedLedgerPromotionStatus | null;
    promoted_at: string | null;
    reverted_at: string | null;
  };
  history: ReviewedLedgerHistoryEvent[];
}

export interface IngestUnknownAnswersInput {
  questions: string[];
  draftedAnswer: string;
  sourcePath: EmailSourcePath;
  scenarioCategory: string;
  language: string;
  normalizedText: string;
}

export interface IngestUnknownAnswersResult {
  path: string;
  created: ReviewedLedgerEntry[];
  duplicates: ReviewedLedgerEntry[];
}

export interface ReviewedFaqPromotionRecord {
  key: string;
  source_entry_id: string;
  question_hash: string;
  question: string;
  answer: string;
  status: ReviewedLedgerPromotionStatus;
  promoted_at: string;
  reverted_at: string | null;
}

export interface PromoteReviewedLedgerEntryResult {
  ledgerPath: string;
  promotionPath: string;
  entry: ReviewedLedgerEntry;
  promotionRecord: ReviewedFaqPromotionRecord;
  idempotent: boolean;
}

export interface RevertReviewedLedgerPromotionResult {
  ledgerPath: string;
  promotionPath: string;
  entry: ReviewedLedgerEntry;
  promotionRecord: ReviewedFaqPromotionRecord | null;
  idempotent: boolean;
}

const ALLOWED_TRANSITIONS: Record<ReviewedLedgerReviewState, ReviewedLedgerReviewState[]> = {
  new: ["approved", "rejected", "deferred"],
  approved: [],
  rejected: [],
  deferred: ["approved", "rejected"],
};

function resolveDefaultLedgerPath(): string {
  if (process.env.REVIEWED_LEDGER_PATH) {
    return process.env.REVIEWED_LEDGER_PATH;
  }

  const fromMonorepoRoot = nodePath.join(
    process.cwd(),
    "packages",
    "mcp-server",
    "data",
    "reviewed-learning-ledger.jsonl",
  );
  const fromPackageRoot = nodePath.join(
    process.cwd(),
    "data",
    "reviewed-learning-ledger.jsonl",
  );

  if (
    process.cwd().endsWith(`${nodePath.sep}packages${nodePath.sep}mcp-server`) ||
    process.cwd().endsWith(`${nodePath.sep}packages${nodePath.sep}mcp-server${nodePath.sep}`)
  ) {
    return fromPackageRoot;
  }

  return fromMonorepoRoot;
}

function resolveDefaultPromotionPath(): string {
  if (process.env.REVIEWED_PROMOTION_PATH) {
    return process.env.REVIEWED_PROMOTION_PATH;
  }

  const fromMonorepoRoot = nodePath.join(
    process.cwd(),
    "packages",
    "mcp-server",
    "data",
    "reviewed-learning-promotions.json",
  );
  const fromPackageRoot = nodePath.join(
    process.cwd(),
    "data",
    "reviewed-learning-promotions.json",
  );

  if (
    process.cwd().endsWith(`${nodePath.sep}packages${nodePath.sep}mcp-server`) ||
    process.cwd().endsWith(`${nodePath.sep}packages${nodePath.sep}mcp-server${nodePath.sep}`)
  ) {
    return fromPackageRoot;
  }

  return fromMonorepoRoot;
}

function sanitizeContextSnippet(text: string): string {
  const collapsed = text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[redacted-phone]")
    .replace(/\s+/g, " ")
    .trim();

  if (collapsed.length <= 280) {
    return collapsed;
  }

  return `${collapsed.slice(0, 277)}...`;
}

function normalizeQuestion(question: string): string {
  return question.replace(/\s+/g, " ").trim();
}

export function hashQuestion(question: string): string {
  const normalized = normalizeQuestion(question).toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

function parseLedgerEntry(raw: unknown): ReviewedLedgerEntry | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Partial<ReviewedLedgerEntry>;
  if (
    typeof candidate.entry_id !== "string" ||
    typeof candidate.created_at !== "string" ||
    typeof candidate.updated_at !== "string" ||
    typeof candidate.review_state !== "string" ||
    typeof candidate.question_hash !== "string" ||
    typeof candidate.question !== "string" ||
    typeof candidate.drafted_answer !== "string"
  ) {
    return null;
  }

  if (!["new", "approved", "rejected", "deferred"].includes(candidate.review_state)) {
    return null;
  }

  const legacyPromotionKey = typeof (candidate as { promotion_key?: unknown }).promotion_key === "string"
    ? (candidate as { promotion_key: string }).promotion_key
    : null;
  const legacyPromotionStatus = typeof (candidate as { promotion_status?: unknown }).promotion_status === "string"
    ? (candidate as { promotion_status: ReviewedLedgerPromotionStatus }).promotion_status
    : null;
  const legacyPromotedAt = typeof (candidate as { promoted_at?: unknown }).promoted_at === "string"
    ? (candidate as { promoted_at: string }).promoted_at
    : null;
  const legacyRevertedAt = typeof (candidate as { reverted_at?: unknown }).reverted_at === "string"
    ? (candidate as { reverted_at: string }).reverted_at
    : null;

  return {
    entry_id: candidate.entry_id,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
    verdict: (candidate.verdict as ReviewedLedgerReviewState) ?? candidate.review_state,
    review_state: candidate.review_state as ReviewedLedgerReviewState,
    question_hash: candidate.question_hash,
    question: candidate.question,
    drafted_answer: candidate.drafted_answer,
    source_path: (candidate.source_path as EmailSourcePath) ?? "unknown",
    scenario_category: candidate.scenario_category ?? "unknown",
    language: candidate.language ?? "UNKNOWN",
    context_excerpt: candidate.context_excerpt ?? "",
    promotion: candidate.promotion ?? {
      key: legacyPromotionKey,
      status: legacyPromotionStatus,
      promoted_at: legacyPromotedAt,
      reverted_at: legacyRevertedAt,
    },
    history: Array.isArray(candidate.history)
      ? candidate.history as ReviewedLedgerHistoryEvent[]
      : [],
  };
}

function serializeLedgerEntries(entries: ReviewedLedgerEntry[]): string {
  if (entries.length === 0) {
    return "";
  }
  return `${entries.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
}

async function writeReviewedLedgerEntries(
  entries: ReviewedLedgerEntry[],
  ledgerPath: string,
): Promise<void> {
  await fs.mkdir(nodePath.dirname(ledgerPath), { recursive: true });
  const tmpPath = `${ledgerPath}.tmp`;
  await fs.writeFile(tmpPath, serializeLedgerEntries(entries), "utf-8");
  await fs.rename(tmpPath, ledgerPath);
}

function normalizePromotionRecord(raw: unknown): ReviewedFaqPromotionRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Partial<ReviewedFaqPromotionRecord>;
  if (
    typeof candidate.key !== "string" ||
    typeof candidate.source_entry_id !== "string" ||
    typeof candidate.question_hash !== "string" ||
    typeof candidate.question !== "string" ||
    typeof candidate.answer !== "string" ||
    (candidate.status !== "active" && candidate.status !== "reverted") ||
    typeof candidate.promoted_at !== "string"
  ) {
    return null;
  }

  return {
    key: candidate.key,
    source_entry_id: candidate.source_entry_id,
    question_hash: candidate.question_hash,
    question: candidate.question,
    answer: candidate.answer,
    status: candidate.status,
    promoted_at: candidate.promoted_at,
    reverted_at: typeof candidate.reverted_at === "string" ? candidate.reverted_at : null,
  };
}

export async function readReviewedPromotionRecords(
  promotionPath = resolveDefaultPromotionPath(),
): Promise<ReviewedFaqPromotionRecord[]> {
  try {
    const raw = await fs.readFile(promotionPath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    const records = Array.isArray(parsed)
      ? parsed
      : (parsed as { records?: unknown }).records;
    if (!Array.isArray(records)) {
      return [];
    }

    return records
      .map((record) => normalizePromotionRecord(record))
      .filter((record): record is ReviewedFaqPromotionRecord => record !== null);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

async function writeReviewedPromotionRecords(
  records: ReviewedFaqPromotionRecord[],
  promotionPath: string,
): Promise<void> {
  await fs.mkdir(nodePath.dirname(promotionPath), { recursive: true });
  const tmpPath = `${promotionPath}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify({ records }, null, 2), "utf-8");
  await fs.rename(tmpPath, promotionPath);
}

function appendHistoryEvent(
  entry: ReviewedLedgerEntry,
  event: ReviewedLedgerHistoryEvent["event"],
  details: Record<string, string>,
  at: string,
): ReviewedLedgerEntry {
  return {
    ...entry,
    updated_at: at,
    history: [
      ...entry.history,
      {
        at,
        event,
        details,
      },
    ],
  };
}

export async function readReviewedLedgerEntries(
  ledgerPath = resolveDefaultLedgerPath(),
): Promise<ReviewedLedgerEntry[]> {
  try {
    const raw = await fs.readFile(ledgerPath, "utf-8");
    const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
    const entries: ReviewedLedgerEntry[] = [];

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as unknown;
        const entry = parseLedgerEntry(parsed);
        if (entry) {
          entries.push(entry);
        }
      } catch {
        // Ignore malformed lines to keep ingestion path non-fatal.
      }
    }

    return entries;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function transitionReviewedLedgerState(
  entry: ReviewedLedgerEntry,
  nextState: ReviewedLedgerReviewState,
  at = new Date().toISOString(),
): ReviewedLedgerEntry {
  const allowed = ALLOWED_TRANSITIONS[entry.review_state];
  if (!allowed.includes(nextState)) {
    throw new Error(`invalid_transition:${entry.review_state}->${nextState}`);
  }

  return {
    ...entry,
    verdict: nextState,
    review_state: nextState,
    updated_at: at,
    history: [
      ...entry.history,
      {
        at,
        event: "state_transition",
        details: {
          from: entry.review_state,
          to: nextState,
        },
      },
    ],
  };
}

export async function setReviewedLedgerState(
  entryId: string,
  nextState: ReviewedLedgerReviewState,
  at = new Date().toISOString(),
  ledgerPath = resolveDefaultLedgerPath(),
): Promise<ReviewedLedgerEntry> {
  const entries = await readReviewedLedgerEntries(ledgerPath);
  const index = entries.findIndex((entry) => entry.entry_id === entryId);
  if (index < 0) {
    throw new Error(`ledger_entry_not_found:${entryId}`);
  }

  const transitioned = transitionReviewedLedgerState(entries[index], nextState, at);
  entries[index] = transitioned;
  await writeReviewedLedgerEntries(entries, ledgerPath);
  return transitioned;
}

export async function promoteReviewedLedgerEntry(
  entryId: string,
  at = new Date().toISOString(),
  ledgerPath = resolveDefaultLedgerPath(),
  promotionPath = resolveDefaultPromotionPath(),
): Promise<PromoteReviewedLedgerEntryResult> {
  const entries = await readReviewedLedgerEntries(ledgerPath);
  const entryIndex = entries.findIndex((entry) => entry.entry_id === entryId);
  if (entryIndex < 0) {
    throw new Error(`ledger_entry_not_found:${entryId}`);
  }

  const entry = entries[entryIndex];
  if (entry.review_state !== "approved") {
    throw new Error("promotion_requires_approved_state");
  }

  const promotionKey = `faq:${entry.question_hash}`;
  const promotions = await readReviewedPromotionRecords(promotionPath);
  const existingIndex = promotions.findIndex((record) => record.key === promotionKey);

  if (existingIndex >= 0 && promotions[existingIndex].source_entry_id !== entry.entry_id) {
    throw new Error("promotion_conflict_existing_key");
  }

  const existing = existingIndex >= 0 ? promotions[existingIndex] : null;
  const isIdempotent = existing?.status === "active";
  const promotionRecord: ReviewedFaqPromotionRecord = existing
    ? {
      ...existing,
      status: "active",
      reverted_at: null,
      promoted_at: existing.promoted_at ?? at,
      question: entry.question,
      answer: entry.drafted_answer.trim(),
    }
    : {
      key: promotionKey,
      source_entry_id: entry.entry_id,
      question_hash: entry.question_hash,
      question: entry.question,
      answer: entry.drafted_answer.trim(),
      status: "active",
      promoted_at: at,
      reverted_at: null,
    };

  if (existingIndex >= 0) {
    promotions[existingIndex] = promotionRecord;
  } else {
    promotions.push(promotionRecord);
  }

  const promotedEntry = appendHistoryEvent(
    {
      ...entry,
      promotion: {
        key: promotionRecord.key,
        status: "active",
        promoted_at: promotionRecord.promoted_at,
        reverted_at: null,
      },
    },
    isIdempotent ? "promotion_idempotent" : "promoted",
    { key: promotionRecord.key },
    at,
  );

  entries[entryIndex] = promotedEntry;
  await writeReviewedLedgerEntries(entries, ledgerPath);
  await writeReviewedPromotionRecords(promotions, promotionPath);

  return {
    ledgerPath,
    promotionPath,
    entry: promotedEntry,
    promotionRecord,
    idempotent: isIdempotent,
  };
}

export async function revertReviewedLedgerPromotion(
  entryId: string,
  at = new Date().toISOString(),
  ledgerPath = resolveDefaultLedgerPath(),
  promotionPath = resolveDefaultPromotionPath(),
): Promise<RevertReviewedLedgerPromotionResult> {
  const entries = await readReviewedLedgerEntries(ledgerPath);
  const entryIndex = entries.findIndex((entry) => entry.entry_id === entryId);
  if (entryIndex < 0) {
    throw new Error(`ledger_entry_not_found:${entryId}`);
  }

  const entry = entries[entryIndex];
  if (!entry.promotion.key) {
    return {
      ledgerPath,
      promotionPath,
      entry,
      promotionRecord: null,
      idempotent: true,
    };
  }

  const promotions = await readReviewedPromotionRecords(promotionPath);
  const recordIndex = promotions.findIndex((record) => record.key === entry.promotion.key);
  if (recordIndex < 0) {
    return {
      ledgerPath,
      promotionPath,
      entry,
      promotionRecord: null,
      idempotent: true,
    };
  }

  if (promotions[recordIndex].source_entry_id !== entry.entry_id) {
    throw new Error("promotion_conflict_existing_key");
  }

  const record = promotions[recordIndex];
  if (record.status === "reverted") {
    return {
      ledgerPath,
      promotionPath,
      entry,
      promotionRecord: record,
      idempotent: true,
    };
  }

  const revertedRecord: ReviewedFaqPromotionRecord = {
    ...record,
    status: "reverted",
    reverted_at: at,
  };
  promotions[recordIndex] = revertedRecord;

  const revertedEntry = appendHistoryEvent(
    {
      ...entry,
      promotion: {
        ...entry.promotion,
        status: "reverted",
        reverted_at: at,
      },
    },
    "reverted",
    { key: record.key },
    at,
  );

  entries[entryIndex] = revertedEntry;
  await writeReviewedLedgerEntries(entries, ledgerPath);
  await writeReviewedPromotionRecords(promotions, promotionPath);

  return {
    ledgerPath,
    promotionPath,
    entry: revertedEntry,
    promotionRecord: revertedRecord,
    idempotent: false,
  };
}

export async function readActiveFaqPromotions(
  promotionPath = resolveDefaultPromotionPath(),
): Promise<ReviewedFaqPromotionRecord[]> {
  const records = await readReviewedPromotionRecords(promotionPath);
  return records
    .filter((record) => record.status === "active" && record.key.startsWith("faq:"))
    .sort((left, right) => left.promoted_at.localeCompare(right.promoted_at));
}

export async function ingestUnknownAnswerEntries(
  input: IngestUnknownAnswersInput,
  ledgerPath = resolveDefaultLedgerPath(),
): Promise<IngestUnknownAnswersResult> {
  const now = new Date().toISOString();
  const existing = await readReviewedLedgerEntries(ledgerPath);
  const existingByHash = new Map(existing.map((entry) => [entry.question_hash, entry]));

  const created: ReviewedLedgerEntry[] = [];
  const duplicates: ReviewedLedgerEntry[] = [];
  const contextExcerpt = sanitizeContextSnippet(input.normalizedText);

  for (const rawQuestion of input.questions) {
    const question = normalizeQuestion(rawQuestion);
    if (!question) {
      continue;
    }

    const questionHash = hashQuestion(question);
    const duplicate = existingByHash.get(questionHash);
    if (duplicate) {
      duplicates.push(duplicate);
      continue;
    }

    const entry: ReviewedLedgerEntry = {
      entry_id: `ledger-${randomUUID()}`,
      created_at: now,
      updated_at: now,
      verdict: "new",
      review_state: "new",
      question_hash: questionHash,
      question,
      drafted_answer: input.draftedAnswer.trim(),
      source_path: input.sourcePath,
      scenario_category: input.scenarioCategory,
      language: input.language,
      context_excerpt: contextExcerpt,
      promotion: {
        key: null,
        status: null,
        promoted_at: null,
        reverted_at: null,
      },
      history: [
        {
          at: now,
          event: "created",
          details: {
            review_state: "new",
            source_path: input.sourcePath,
          },
        },
      ],
    };

    created.push(entry);
    existingByHash.set(questionHash, entry);
  }

  if (created.length > 0) {
    await fs.mkdir(nodePath.dirname(ledgerPath), { recursive: true });
    const payload = `${created.map((entry) => JSON.stringify(entry)).join("\n")}\n`;
    await fs.appendFile(ledgerPath, payload, "utf-8");
  }

  return {
    path: ledgerPath,
    created,
    duplicates,
  };
}
