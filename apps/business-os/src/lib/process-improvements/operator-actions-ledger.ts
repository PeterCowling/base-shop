import { createHash } from "node:crypto";
import path from "node:path";

import { getRepoRoot } from "@/lib/get-repo-root";
import {
  appendFileWithinRoot,
  mkdirWithinRoot,
  readFileWithinRoot,
} from "@/lib/safe-fs";

import {
  parseProcessImprovementsOperatorActionDecisionEvent,
  PROCESS_IMPROVEMENTS_OPERATOR_ACTION_DECISION_EVENT_SCHEMA_VERSION,
  PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH,
  type ProcessImprovementsOperatorActionDecisionEvent,
  type ProcessImprovementsOperatorActionDecisionState,
  type ProcessImprovementsOperatorActionDecisionType,
  reduceProcessImprovementsOperatorActionDecisionEvents,
} from "../../../../../scripts/src/startup-loop/operator-action-decisions-contract";

export {
  PROCESS_IMPROVEMENTS_OPERATOR_ACTION_DECISION_EVENT_SCHEMA_VERSION,
  PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH,
  reduceProcessImprovementsOperatorActionDecisionEvents,
};
export type {
  ProcessImprovementsOperatorActionDecisionEvent,
  ProcessImprovementsOperatorActionDecisionState,
  ProcessImprovementsOperatorActionDecisionType,
};

export interface AppendProcessImprovementsOperatorActionDecisionEventInput {
  actionId: string;
  business: string;
  sourcePath: string;
  decision: ProcessImprovementsOperatorActionDecisionType;
  actorId: string;
  actorName: string;
  decidedAt?: string;
  snoozeUntil?: string;
}

export interface LoadProcessImprovementsOperatorActionDecisionStatesOptions {
  repoRoot?: string;
}

function buildEventId(
  input: Pick<
    ProcessImprovementsOperatorActionDecisionEvent,
    "action_id" | "decision" | "actor_id" | "decided_at"
  >
): string {
  return createHash("sha1")
    .update(
      [
        input.action_id,
        input.decision,
        input.actor_id,
        input.decided_at,
      ].join("::")
    )
    .digest("hex");
}

export async function readProcessImprovementsOperatorActionDecisionEvents(
  repoRoot: string = getRepoRoot()
): Promise<ProcessImprovementsOperatorActionDecisionEvent[]> {
  const absolutePath = path.join(
    repoRoot,
    PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH
  );

  let raw: string;
  try {
    raw = (await readFileWithinRoot(repoRoot, absolutePath, "utf-8")) as string;
  } catch {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .map((line) => parseProcessImprovementsOperatorActionDecisionEvent(line))
    .filter(
      (
        event
      ): event is ProcessImprovementsOperatorActionDecisionEvent => event !== null
    );
}

export async function loadProcessImprovementsOperatorActionDecisionStates(
  options: LoadProcessImprovementsOperatorActionDecisionStatesOptions = {}
): Promise<Map<string, ProcessImprovementsOperatorActionDecisionState>> {
  const events = await readProcessImprovementsOperatorActionDecisionEvents(
    options.repoRoot
  );
  return reduceProcessImprovementsOperatorActionDecisionEvents(events);
}

export async function appendProcessImprovementsOperatorActionDecisionEvent(
  input: AppendProcessImprovementsOperatorActionDecisionEventInput,
  repoRoot: string = getRepoRoot()
): Promise<ProcessImprovementsOperatorActionDecisionEvent> {
  const decidedAt = input.decidedAt ?? new Date().toISOString();

  if (!input.actionId || !input.business || !input.sourcePath) {
    throw new Error("actionId, business, and sourcePath are required");
  }
  if (!input.actorId || !input.actorName) {
    throw new Error("actorId and actorName are required");
  }
  if (input.decision === "snooze" && !input.snoozeUntil) {
    throw new Error("snoozeUntil is required for snooze decisions");
  }

  const event: ProcessImprovementsOperatorActionDecisionEvent = {
    schema_version:
      PROCESS_IMPROVEMENTS_OPERATOR_ACTION_DECISION_EVENT_SCHEMA_VERSION,
    event_id: buildEventId({
      action_id: input.actionId,
      decision: input.decision,
      actor_id: input.actorId,
      decided_at: decidedAt,
    }),
    action_id: input.actionId,
    business: input.business,
    source_path: input.sourcePath,
    decision: input.decision,
    actor_id: input.actorId,
    actor_name: input.actorName,
    decided_at: decidedAt,
    snooze_until: input.snoozeUntil,
  };

  await mkdirWithinRoot(
    repoRoot,
    path.dirname(
      path.join(repoRoot, PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH)
    ),
    { recursive: true }
  );

  await appendFileWithinRoot(
    repoRoot,
    path.join(repoRoot, PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH),
    `${JSON.stringify(event)}\n`,
    "utf-8"
  );

  return event;
}
