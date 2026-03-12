import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";

import type {
  BlockingScope,
  GapCaseReference,
  PrescriptionMaturity,
  PrescriptionReference,
  RequirementPosture,
  UnknownPrescriptionDiscoveryContract,
} from "../self-evolving/self-evolving-contracts.js";

export type QueueStateKey =
  | "enqueued"
  | "processed"
  | "declined"
  | "skipped"
  | "error"
  | "suppressed"
  | "auto_executed"
  | "completed";

export interface DispatchSelfEvolvingLink {
  candidate_id: string;
  decision_id: string;
  gap_case?: GapCaseReference;
  prescription?: PrescriptionReference;
  requirement_posture?: RequirementPosture;
  blocking_scope?: BlockingScope;
  prescription_maturity?: PrescriptionMaturity;
  discovery_contract?: UnknownPrescriptionDiscoveryContract;
  policy_version: string;
  recommended_route_origin: "lp-do-fact-find" | "lp-do-plan" | "lp-do-build";
  executor_path: string;
  handoff_emitted_at: string;
}

export interface QueueCompletedSelfEvolving {
  candidate_id: string;
  decision_id: string;
  gap_case?: GapCaseReference;
  prescription?: PrescriptionReference;
  dispatch_id: string;
  maturity_due_at: string;
  maturity_status: "pending" | "matured";
  measurement_status:
    | "pending"
    | "verified"
    | "verified_degraded"
    | "missing"
    | "insufficient_sample";
  outcome_event_id: string | null;
  verified_observation_ids: string[];
}

export interface QueueProcessedBy {
  route?: string;
  target_route?: string;
  target_kind?: string;
  target_slug?: string;
  target_path?: string;
  processed_at?: string;
  fact_find_slug?: string;
  fact_find_path?: string;
  self_evolving?: DispatchSelfEvolvingLink;
  [key: string]: unknown;
}

export interface QueueCompletedBy {
  plan_path?: string;
  micro_build_path?: string;
  completed_at: string;
  outcome: string;
  self_evolving?: QueueCompletedSelfEvolving;
}

export interface QueueDeclinedBy {
  actor_id: string;
  actor_name: string;
  declined_at: string;
  reason: string;
}

export interface QueueDispatch {
  dispatch_id?: string;
  business?: string;
  status?: string;
  queue_state?: string;
  created_at?: string;
  recommended_route?: string;
  provisional_deliverable_family?: string;
  area_anchor?: string;
  location_anchors?: string[];
  processed_by?: QueueProcessedBy;
  completed_by?: QueueCompletedBy;
  declined_by?: QueueDeclinedBy;
  self_evolving?: DispatchSelfEvolvingLink;
  [key: string]: unknown;
}

export interface QueueFileShape {
  last_updated?: string;
  counts?: Record<string, number>;
  dispatches: QueueDispatch[];
}

export type QueueFileReadResult =
  | { ok: true; queue: QueueFileShape }
  | {
      ok: false;
      reason: "file_not_found" | "parse_error" | "write_error";
      error?: string;
    };

const COUNT_KEYS: readonly QueueStateKey[] = [
  "enqueued",
  "processed",
  "declined",
  "skipped",
  "error",
  "suppressed",
  "auto_executed",
  "completed",
];

function resolveRepoRootPath(targetPath: string): string {
  if (targetPath.startsWith(sep) || /^[A-Za-z]:[\\/]/.test(targetPath)) {
    return targetPath;
  }

  const repoRoot = process.cwd().endsWith(`${sep}scripts`)
    ? resolve(process.cwd(), "..")
    : process.cwd();

  return resolve(repoRoot, targetPath);
}

export function parseQueueState(raw: string): QueueFileShape | { error: string } {
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

export function readQueueStateFile(queueStatePath: string): QueueFileReadResult {
  const resolvedPath = resolveRepoRootPath(queueStatePath);

  if (!existsSync(resolvedPath)) {
    return { ok: false, reason: "file_not_found" };
  }

  let raw: string;
  try {
    raw = readFileSync(resolvedPath, "utf-8");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "write_error", error: message };
  }

  const parsed = parseQueueState(raw);
  if ("error" in parsed) {
    return { ok: false, reason: "parse_error", error: parsed.error };
  }

  return { ok: true, queue: parsed };
}

export function buildCounts(dispatches: QueueDispatch[]): Record<string, number> {
  const counts: Record<string, number> = {
    enqueued: 0,
    processed: 0,
    declined: 0,
    skipped: 0,
    error: 0,
    suppressed: 0,
    auto_executed: 0,
    completed: 0,
    fact_find_ready: 0,
    plan_ready: 0,
    micro_build_ready: 0,
    briefing_ready: 0,
    total: dispatches.length,
  };

  for (const dispatch of dispatches) {
    const state = dispatch.queue_state;
    if (typeof state === "string" && (COUNT_KEYS as readonly string[]).includes(state)) {
      counts[state] += 1;
    }
    // Routing status counts only reflect actionable (enqueued) entries —
    // suppressed/completed entries with a status field must not inflate these.
    if (state === "enqueued") {
      if (dispatch.status === "fact_find_ready") counts.fact_find_ready += 1;
      if (dispatch.status === "plan_ready") counts.plan_ready += 1;
      if (dispatch.status === "micro_build_ready") counts.micro_build_ready += 1;
      if (dispatch.status === "briefing_ready") counts.briefing_ready += 1;
    }
  }

  return counts;
}

export function atomicWriteQueueState(
  queueStatePath: string,
  queue: QueueFileShape,
): { ok: true } | { ok: false; error: string } {
  const resolvedPath = resolveRepoRootPath(queueStatePath);
  const dir = dirname(resolvedPath);
  const suffix = randomBytes(4).toString("hex");
  const tmpPath = join(dir, `.${basename(resolvedPath)}.tmp.${suffix}`);

  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(tmpPath, JSON.stringify(queue, null, 2) + "\n", "utf-8");
    renameSync(tmpPath, resolvedPath);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }

  return { ok: true };
}
