import type { User } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";

import {
  appendProcessImprovementsOperatorActionDecisionEvent,
  type ProcessImprovementsOperatorActionDecisionType,
} from "./operator-actions-ledger";
import { loadProcessImprovementsProjection } from "./projection";

export interface PerformProcessImprovementsOperatorActionDecisionInput {
  decision: ProcessImprovementsOperatorActionDecisionType;
  actionId: string;
  actor: User;
  now?: Date;
  snoozeDays?: number;
}

export type PerformProcessImprovementsOperatorActionDecisionResult =
  | {
      ok: true;
      decision: ProcessImprovementsOperatorActionDecisionType;
      actionId: string;
      sourcePath: string;
      snoozeUntil?: string;
    }
  | {
      ok: false;
      reason: "no_match" | "conflict" | "write_error";
      error: string;
    };

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function performProcessImprovementsOperatorActionDecision(
  input: PerformProcessImprovementsOperatorActionDecisionInput
): Promise<PerformProcessImprovementsOperatorActionDecisionResult> {
  const repoRoot = getRepoRoot();
  const projection = await loadProcessImprovementsProjection({ repoRoot });
  const item = projection.items.find(
    (candidate) =>
      candidate.itemType === "operator_action" &&
      candidate.actionId === input.actionId
  );

  if (!item || item.itemType !== "operator_action") {
    return {
      ok: false,
      reason: "no_match",
      error: `Operator action ${input.actionId} is no longer available in the inbox.`,
    };
  }

  if (item.decisionState?.decision === "done") {
    return {
      ok: false,
      reason: "conflict",
      error: `Operator action ${input.actionId} has already been completed.`,
    };
  }

  const now = input.now ?? new Date();
  const decidedAt = now.toISOString();
  const snoozeUntil =
    input.decision === "snooze" ? addDays(now, input.snoozeDays ?? 7).toISOString() : undefined;

  try {
    await appendProcessImprovementsOperatorActionDecisionEvent(
      {
        actionId: item.actionId,
        business: item.business,
        sourcePath: item.sourcePath,
        decision: input.decision,
        actorId: input.actor.id,
        actorName: input.actor.name,
        decidedAt,
        snoozeUntil,
      },
      repoRoot
    );
  } catch (error) {
    return {
      ok: false,
      reason: "write_error",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    ok: true,
    decision: input.decision,
    actionId: item.actionId,
    sourcePath: item.sourcePath,
    snoozeUntil,
  };
}
