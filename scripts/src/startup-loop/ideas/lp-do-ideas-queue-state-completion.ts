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

import {
  atomicWriteQueueState,
  buildCounts,
  readQueueStateFile,
} from "./lp-do-ideas-queue-state-file.js";

export interface MarkDispatchesCompletedOptions {
  /** Absolute path to queue-state.json (queue.v1 format). */
  queueStatePath: string;
  /** The feature slug to match against processed_by target slug. */
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

export function markDispatchesCompleted(
  options: MarkDispatchesCompletedOptions,
): MarkDispatchesCompletedResult {
  const clock = options.clock ?? (() => new Date());
  const queueResult = readQueueStateFile(options.queueStatePath);
  if (!queueResult.ok) {
    return queueResult;
  }

  let mutated = 0;
  let skipped = 0;

  for (const dispatch of queueResult.queue.dispatches) {
    const slugMatches =
      dispatch.processed_by?.target_slug === options.featureSlug ||
      dispatch.processed_by?.fact_find_slug === options.featureSlug;
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

  queueResult.queue.counts = buildCounts(queueResult.queue.dispatches);
  queueResult.queue.last_updated = clock().toISOString();

  const writeResult = atomicWriteQueueState(options.queueStatePath, queueResult.queue);
  if (!writeResult.ok) {
    return { ok: false, reason: "write_error", error: writeResult.error };
  }

  return { ok: true, mutated, skipped };
}
