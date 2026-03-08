import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { RankedCandidate } from "./self-evolving-candidates.js";

const SELF_EVOLVING_ROOT = path.join(
  "docs",
  "business-os",
  "startup-loop",
  "self-evolving",
);

export interface SelfEvolvingBackboneQueueEntry {
  queued_at: string;
  business: string;
  candidate_id: string;
  route: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  reason: string;
  executor_path: string;
  autonomy_cap: 1 | 2 | 3 | 4;
  priority: number;
  consumed_at?: string | null;
  consumed_by?: string | null;
  followup_dispatch_id?: string | null;
  followup_queue_state?: "enqueued" | "processed" | "skipped" | "error" | null;
  followup_route?: "lp-do-fact-find" | "lp-do-build" | "lp-do-briefing" | null;
}

export interface BackboneQueueWriteResult {
  path: string;
  queued: number;
  updated: number;
  entries: SelfEvolvingBackboneQueueEntry[];
}

export function resolveBackboneQueuePath(rootDir: string, business: string): string {
  return path.join(rootDir, SELF_EVOLVING_ROOT, business, "backbone-queue.jsonl");
}

export function readBackboneQueue(
  rootDir: string,
  business: string,
): SelfEvolvingBackboneQueueEntry[] {
  const queuePath = resolveBackboneQueuePath(rootDir, business);
  try {
    const raw = readFileSync(queuePath, "utf-8").trim();
    if (raw.length === 0) {
      return [];
    }
    return raw
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as SelfEvolvingBackboneQueueEntry);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export function writeBackboneQueue(
  rootDir: string,
  business: string,
  entries: SelfEvolvingBackboneQueueEntry[],
): string {
  const queuePath = resolveBackboneQueuePath(rootDir, business);
  mkdirSync(path.dirname(queuePath), { recursive: true });
  const body = entries.map((entry) => JSON.stringify(entry)).join("\n");
  writeFileSync(queuePath, body.length > 0 ? `${body}\n` : "", "utf-8");
  return queuePath;
}

function toQueueEntry(
  business: string,
  candidate: RankedCandidate,
  queuedAt: string,
  existing?: SelfEvolvingBackboneQueueEntry,
): SelfEvolvingBackboneQueueEntry | null {
  if (candidate.route.route === "reject") {
    return null;
  }

  const priority = candidate.score.priority_score_v2 ?? candidate.score.priority_score_v1;
  return {
    queued_at: existing?.queued_at ?? queuedAt,
    business,
    candidate_id: candidate.candidate.candidate_id,
    route: candidate.route.route,
    reason: candidate.route.reason,
    executor_path: candidate.candidate.executor_path,
    autonomy_cap: candidate.score.autonomy_cap,
    priority,
    consumed_at: existing?.consumed_at ?? null,
    consumed_by: existing?.consumed_by ?? null,
    followup_dispatch_id: existing?.followup_dispatch_id ?? null,
    followup_queue_state: existing?.followup_queue_state ?? null,
    followup_route: existing?.followup_route ?? null,
  };
}

export function enqueueBackboneCandidates(
  rootDir: string,
  business: string,
  candidates: RankedCandidate[],
  now: Date = new Date(),
): BackboneQueueWriteResult {
  const existingEntries = readBackboneQueue(rootDir, business);
  const byCandidateId = new Map(
    existingEntries.map((entry) => [entry.candidate_id, entry] as const),
  );

  let queued = 0;
  let updated = 0;
  const queuedAt = now.toISOString();

  for (const candidate of candidates) {
    const existing = byCandidateId.get(candidate.candidate.candidate_id);
    const nextEntry = toQueueEntry(business, candidate, queuedAt, existing);
    if (!nextEntry) {
      continue;
    }

    if (!existing) {
      queued += 1;
      byCandidateId.set(nextEntry.candidate_id, nextEntry);
      continue;
    }

    const previousComparable = JSON.stringify(existing);
    const nextComparable = JSON.stringify(nextEntry);
    if (previousComparable !== nextComparable) {
      updated += 1;
      byCandidateId.set(nextEntry.candidate_id, nextEntry);
    }
  }

  const mergedEntries = [...byCandidateId.values()].sort((left, right) => {
    if (left.consumed_at == null && right.consumed_at != null) return -1;
    if (left.consumed_at != null && right.consumed_at == null) return 1;
    if (left.priority !== right.priority) return right.priority - left.priority;
    return Date.parse(left.queued_at) - Date.parse(right.queued_at);
  });

  const queuePath = writeBackboneQueue(rootDir, business, mergedEntries);
  return {
    path: queuePath,
    queued,
    updated,
    entries: mergedEntries,
  };
}
