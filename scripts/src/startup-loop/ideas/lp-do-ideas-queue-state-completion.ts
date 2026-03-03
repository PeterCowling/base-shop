/**
 * Marks queue.v1 dispatches as completed in queue-state.json.
 *
 * This module operates directly on serialized queue.v1 state (docs/business-os/startup-loop/ideas/trial/queue-state.json)
 * and intentionally does not depend on or mutate the in-memory TrialQueue class.
 *
 * Idempotency contract:
 * - Dispatches already in `queue_state: "completed"` are never mutated.
 * - If no eligible non-completed dispatch matches, the function is a no-op and returns `{ ok: false, reason: "no_match" }`.
 *
 * Return shape:
 * - Success: `{ ok: true, mutated, skipped }`
 * - Failure: `{ ok: false, reason, error? }`
 */

import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export interface MarkDispatchesCompletedOptions {
  /** Absolute path to queue-state.json (queue.v1 format). */
  queueStatePath: string;
  /** The feature slug to match against processed_by.fact_find_slug. */
  featureSlug: string;
  /** Path to the archived plan (written into completed_by.plan_path). */
  planPath: string;
  /** One-line outcome summary (written into completed_by.outcome). */
  outcome: string;
  /** Optional business filter — if provided, only dispatches matching this business are mutated. */
  business?: string;
  /** Injectable clock for deterministic completed_at timestamps. Defaults to () => new Date(). */
  clock?: () => Date;
}

export type MarkDispatchesCompletedResult =
  | { ok: true; mutated: number; skipped: number }
  | {
      ok: false;
      reason: "no_match" | "parse_error" | "write_error" | "file_not_found";
      error?: string;
    };

type QueueStateKey =
  | "enqueued"
  | "processed"
  | "skipped"
  | "error"
  | "suppressed"
  | "auto_executed"
  | "completed";

interface QueueDispatch {
  business?: string;
  status?: string;
  queue_state?: string;
  processed_by?: {
    fact_find_slug?: string;
  };
  completed_by?: {
    plan_path: string;
    completed_at: string;
    outcome: string;
  };
}

interface QueueFileShape {
  last_updated?: string;
  counts?: Record<string, number>;
  dispatches: QueueDispatch[];
}

const COUNT_KEYS: readonly QueueStateKey[] = [
  "enqueued",
  "processed",
  "skipped",
  "error",
  "suppressed",
  "auto_executed",
  "completed",
];

function parseQueueState(raw: string): QueueFileShape | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { error: "queue-state.json root must be an object" };
  }

  const objectRoot = parsed as Record<string, unknown>;
  if (!Array.isArray(objectRoot.dispatches)) {
    return { error: "queue-state.json must contain a dispatches array" };
  }

  return {
    last_updated:
      typeof objectRoot.last_updated === "string" ? objectRoot.last_updated : undefined,
    counts:
      typeof objectRoot.counts === "object" && objectRoot.counts !== null
        ? (objectRoot.counts as Record<string, number>)
        : undefined,
    dispatches: objectRoot.dispatches as QueueDispatch[],
  };
}

function buildCounts(dispatches: QueueDispatch[]): Record<string, number> {
  const counts: Record<string, number> = {
    enqueued: 0,
    processed: 0,
    skipped: 0,
    error: 0,
    suppressed: 0,
    auto_executed: 0,
    completed: 0,
    fact_find_ready: 0,
    total: dispatches.length,
  };

  for (const dispatch of dispatches) {
    const state = dispatch.queue_state;
    if (typeof state === "string" && (COUNT_KEYS as readonly string[]).includes(state)) {
      counts[state] += 1;
    }
    if (dispatch.status === "fact_find_ready") {
      counts.fact_find_ready += 1;
    }
  }

  return counts;
}

function atomicWrite(targetPath: string, content: string): void {
  const dir = dirname(targetPath);
  const suffix = randomBytes(4).toString("hex");
  const tmpPath = join(dir, `.${basename(targetPath)}.tmp.${suffix}`);
  writeFileSync(tmpPath, content, "utf-8");
  renameSync(tmpPath, targetPath);
}

export function markDispatchesCompleted(
  options: MarkDispatchesCompletedOptions,
): MarkDispatchesCompletedResult {
  const clock = options.clock ?? (() => new Date());
  if (!existsSync(options.queueStatePath)) {
    return { ok: false, reason: "file_not_found" };
  }

  let raw: string;
  try {
    raw = readFileSync(options.queueStatePath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "write_error", error: message };
  }

  const parsed = parseQueueState(raw);
  if ("error" in parsed) {
    return { ok: false, reason: "parse_error", error: parsed.error };
  }

  let mutated = 0;
  let skipped = 0;

  for (const dispatch of parsed.dispatches) {
    const slugMatches = dispatch.processed_by?.fact_find_slug === options.featureSlug;
    const businessMatches =
      options.business === undefined || dispatch.business === options.business;

    if (dispatch.queue_state === "completed") {
      if (slugMatches && businessMatches) {
        skipped += 1;
      }
      continue;
    }

    if (!slugMatches) {
      continue;
    }

    if (!businessMatches) {
      continue;
    }

    dispatch.queue_state = "completed";
    dispatch.status = "completed";
    dispatch.completed_by = {
      plan_path: options.planPath,
      completed_at: clock().toISOString(),
      outcome: options.outcome,
    };
    mutated += 1;
  }

  if (mutated === 0) {
    return { ok: false, reason: "no_match" };
  }

  parsed.counts = buildCounts(parsed.dispatches);
  parsed.last_updated = clock().toISOString();

  try {
    atomicWrite(options.queueStatePath, JSON.stringify(parsed, null, 2) + "\n");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "write_error", error: message };
  }

  return { ok: true, mutated, skipped };
}
