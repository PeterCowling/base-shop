import { createHash } from "node:crypto";
import path from "node:path";

import { getRepoRoot } from "@/lib/get-repo-root";
import {
  appendFileWithinRoot,
  mkdirWithinRoot,
  readFileWithinRoot,
} from "@/lib/safe-fs";

import type { ProcessImprovementsDecisionState } from "./projection";
import { resolveProcessImprovementsQueuePath } from "./queue-path";

export const PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH =
  "docs/business-os/process-improvements/operator-decisions.jsonl";

export const PROCESS_IMPROVEMENTS_DECISION_EVENT_SCHEMA_VERSION =
  "process-improvements.decision.v1";

export type ProcessImprovementsDecisionType = "do" | "defer" | "decline";
export type ProcessImprovementsExecutionResult =
  | "pending"
  | "succeeded"
  | "failed";

export interface ProcessImprovementsDecisionEvent {
  schema_version: typeof PROCESS_IMPROVEMENTS_DECISION_EVENT_SCHEMA_VERSION;
  event_id: string;
  idea_key: string;
  dispatch_id: string;
  business: string;
  source_path: string;
  queue_mode: "trial" | "live";
  decision: ProcessImprovementsDecisionType;
  actor_id: string;
  actor_name: string;
  decided_at: string;
  defer_until?: string;
  execution_result?: ProcessImprovementsExecutionResult;
  execution_error?: string;
  rationale?: string;
}

export interface AppendProcessImprovementsDecisionEventInput {
  ideaKey: string;
  dispatchId: string;
  business: string;
  decision: ProcessImprovementsDecisionType;
  actorId: string;
  actorName: string;
  decidedAt?: string;
  deferUntil?: string;
  executionResult?: ProcessImprovementsExecutionResult;
  executionError?: string;
  rationale?: string;
  sourcePath?: string;
  queueMode?: "trial" | "live";
}

export interface LoadProcessImprovementsDecisionStatesOptions {
  repoRoot?: string;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function isDecisionType(
  value: unknown
): value is ProcessImprovementsDecisionType {
  return value === "do" || value === "defer" || value === "decline";
}

function isExecutionResult(
  value: unknown
): value is ProcessImprovementsExecutionResult {
  return value === "pending" || value === "succeeded" || value === "failed";
}

function hasRequiredDecisionFields(input: {
  schemaVersion: string | undefined;
  eventId: string | undefined;
  ideaKey: string | undefined;
  dispatchId: string | undefined;
  business: string | undefined;
  sourcePath: string | undefined;
  queueMode: string | undefined;
  decision: unknown;
  actorId: string | undefined;
  actorName: string | undefined;
  decidedAt: string | undefined;
}): input is {
  schemaVersion: typeof PROCESS_IMPROVEMENTS_DECISION_EVENT_SCHEMA_VERSION;
  eventId: string;
  ideaKey: string;
  dispatchId: string;
  business: string;
  sourcePath: string;
  queueMode: "trial" | "live";
  decision: ProcessImprovementsDecisionType;
  actorId: string;
  actorName: string;
  decidedAt: string;
} {
  return (
    input.schemaVersion === PROCESS_IMPROVEMENTS_DECISION_EVENT_SCHEMA_VERSION &&
    !!input.eventId &&
    !!input.ideaKey &&
    !!input.dispatchId &&
    !!input.business &&
    !!input.sourcePath &&
    (input.queueMode === "trial" || input.queueMode === "live") &&
    isDecisionType(input.decision) &&
    !!input.actorId &&
    !!input.actorName &&
    !!input.decidedAt
  );
}

function getRequiredDecisionFields(record: Record<string, unknown>) {
  const requiredFields = {
    schemaVersion: readString(record.schema_version),
    eventId: readString(record.event_id),
    ideaKey: readString(record.idea_key),
    dispatchId: readString(record.dispatch_id),
    business: readString(record.business),
    sourcePath: readString(record.source_path),
    queueMode: readString(record.queue_mode),
    decision: record.decision,
    actorId: readString(record.actor_id),
    actorName: readString(record.actor_name),
    decidedAt: readString(record.decided_at),
  };

  return hasRequiredDecisionFields(requiredFields) ? requiredFields : null;
}

function parseDecisionRecord(
  rawLine: string
): Record<string, unknown> | null {
  if (rawLine.trim().length === 0) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawLine);
  } catch {
    return null;
  }

  return typeof parsed === "object" && parsed !== null
    ? (parsed as Record<string, unknown>)
    : null;
}

function normalizeExecutionResult(
  value: unknown
): ProcessImprovementsExecutionResult | undefined | null {
  if (value === undefined || value === null) {
    return undefined;
  }

  return isExecutionResult(value) ? value : null;
}

function parseDecisionEvent(
  rawLine: string
): ProcessImprovementsDecisionEvent | null {
  const record = parseDecisionRecord(rawLine);
  if (!record) {
    return null;
  }

  const requiredFields = getRequiredDecisionFields(record);
  if (!requiredFields) {
    return null;
  }

  const executionResult = normalizeExecutionResult(record.execution_result);

  if (executionResult === null) {
    return null;
  }

  const deferUntil = readString(record.defer_until);
  const executionError = readString(record.execution_error);
  const rationale = readString(record.rationale);

  return {
    schema_version: PROCESS_IMPROVEMENTS_DECISION_EVENT_SCHEMA_VERSION,
    event_id: requiredFields.eventId,
    idea_key: requiredFields.ideaKey,
    dispatch_id: requiredFields.dispatchId,
    business: requiredFields.business,
    source_path: requiredFields.sourcePath,
    queue_mode: requiredFields.queueMode,
    decision: requiredFields.decision,
    actor_id: requiredFields.actorId,
    actor_name: requiredFields.actorName,
    decided_at: requiredFields.decidedAt,
    defer_until: deferUntil,
    execution_result: executionResult,
    execution_error: executionError,
    rationale,
  };
}

function buildEventId(
  input: Pick<
    ProcessImprovementsDecisionEvent,
    | "idea_key"
    | "dispatch_id"
    | "decision"
    | "actor_id"
    | "decided_at"
    | "execution_result"
  >
): string {
  return createHash("sha1")
    .update(
      [
        input.idea_key,
        input.dispatch_id,
        input.decision,
        input.actor_id,
        input.decided_at,
        input.execution_result ?? "none",
      ].join("::")
    )
    .digest("hex");
}

export function reduceProcessImprovementsDecisionEvents(
  events: readonly ProcessImprovementsDecisionEvent[]
): Map<string, ProcessImprovementsDecisionState> {
  const orderedEvents = [...events].sort((left, right) => {
    return (
      left.decided_at.localeCompare(right.decided_at) ||
      left.event_id.localeCompare(right.event_id)
    );
  });

  const reduced = new Map<string, ProcessImprovementsDecisionState>();

  for (const event of orderedEvents) {
    reduced.set(event.idea_key, {
      decision: event.decision,
      decidedAt: event.decided_at,
      deferUntil: event.defer_until,
      executionResult: event.execution_result,
      executionError: event.execution_error,
      rationale: event.rationale,
    });
  }

  return reduced;
}

export async function readProcessImprovementsDecisionEvents(
  repoRoot: string = getRepoRoot()
): Promise<ProcessImprovementsDecisionEvent[]> {
  const absolutePath = path.join(
    repoRoot,
    PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH
  );

  let raw: string;
  try {
    raw = (await readFileWithinRoot(repoRoot, absolutePath, "utf-8")) as string;
  } catch {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .map((line) => parseDecisionEvent(line))
    .filter(
      (event): event is ProcessImprovementsDecisionEvent => event !== null
    );
}

export async function loadProcessImprovementsDecisionStates(
  options: LoadProcessImprovementsDecisionStatesOptions = {}
): Promise<Map<string, ProcessImprovementsDecisionState>> {
  const events = await readProcessImprovementsDecisionEvents(options.repoRoot);
  return reduceProcessImprovementsDecisionEvents(events);
}

export async function appendProcessImprovementsDecisionEvent(
  input: AppendProcessImprovementsDecisionEventInput,
  repoRoot: string = getRepoRoot()
): Promise<ProcessImprovementsDecisionEvent> {
  const decidedAt = input.decidedAt ?? new Date().toISOString();
  const sourcePath =
    input.sourcePath ??
    resolveProcessImprovementsQueuePath().relativePath;
  const queueMode =
    input.queueMode ?? resolveProcessImprovementsQueuePath().queueMode;
  const executionResult =
    input.executionResult ??
    (input.decision === "defer" ? undefined : "pending");

  if (!input.ideaKey || !input.dispatchId || !input.business) {
    throw new Error("ideaKey, dispatchId, and business are required");
  }
  if (!input.actorId || !input.actorName) {
    throw new Error("actorId and actorName are required");
  }
  if (input.decision === "defer" && !input.deferUntil) {
    throw new Error("deferUntil is required for defer decisions");
  }

  const event: ProcessImprovementsDecisionEvent = {
    schema_version: PROCESS_IMPROVEMENTS_DECISION_EVENT_SCHEMA_VERSION,
    event_id: buildEventId({
      idea_key: input.ideaKey,
      dispatch_id: input.dispatchId,
      decision: input.decision,
      actor_id: input.actorId,
      decided_at: decidedAt,
      execution_result: executionResult,
    }),
    idea_key: input.ideaKey,
    dispatch_id: input.dispatchId,
    business: input.business,
    source_path: sourcePath,
    queue_mode: queueMode,
    decision: input.decision,
    actor_id: input.actorId,
    actor_name: input.actorName,
    decided_at: decidedAt,
    defer_until: input.deferUntil,
    execution_result: executionResult,
    execution_error: input.executionError,
    rationale: input.rationale,
  };

  await mkdirWithinRoot(
    repoRoot,
    path.dirname(path.join(repoRoot, PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH)),
    { recursive: true }
  );

  await appendFileWithinRoot(
    repoRoot,
    path.join(repoRoot, PROCESS_IMPROVEMENTS_DECISION_LEDGER_PATH),
    `${JSON.stringify(event)}\n`,
    "utf-8"
  );

  return event;
}
