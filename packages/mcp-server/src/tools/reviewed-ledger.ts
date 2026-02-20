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
      key: null,
      status: null,
      promoted_at: null,
      reverted_at: null,
    },
    history: Array.isArray(candidate.history)
      ? candidate.history as ReviewedLedgerHistoryEvent[]
      : [],
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
