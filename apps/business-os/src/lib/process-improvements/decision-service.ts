import type { User } from "@/lib/current-user";
import { getRepoRoot } from "@/lib/get-repo-root";

import {
  declineQueuedIdea,
  handoffQueuedIdeaToRegularProcess,
} from "../../../../../scripts/src/startup-loop/ideas/lp-do-ideas-operator-actions.js";

import {
  appendProcessImprovementsDecisionEvent,
  type ProcessImprovementsDecisionType,
} from "./decision-ledger";
import {
  isProcessImprovementQueueItem,
  loadProcessImprovementsProjection,
  type ProcessImprovementQueueInboxItem,
} from "./projection";
import { resolveProcessImprovementsQueuePath } from "./queue-path";

export interface PerformProcessImprovementsDecisionInput {
  decision: ProcessImprovementsDecisionType;
  dispatchId: string;
  ideaKey: string;
  actor: User;
  now?: Date;
  deferDays?: number;
}

export type PerformProcessImprovementsDecisionResult =
  | {
      ok: true;
      decision: ProcessImprovementsDecisionType;
      dispatchId: string;
      ideaKey: string;
      deferUntil?: string;
      targetPath?: string;
      targetRoute?: string;
    }
  | {
      ok: false;
      reason: "no_match" | "conflict" | "write_error" | "invalid_dispatch";
      error: string;
    };

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function performProcessImprovementsDecision(
  input: PerformProcessImprovementsDecisionInput
): Promise<PerformProcessImprovementsDecisionResult> {
  const repoRoot = getRepoRoot();
  const queuePath = resolveProcessImprovementsQueuePath();
  const projection = await loadProcessImprovementsProjection({ repoRoot });
  const item = projection.items.find(
    (
      candidate
    ): candidate is ProcessImprovementQueueInboxItem =>
      isProcessImprovementQueueItem(candidate) &&
      candidate.dispatchId === input.dispatchId &&
      candidate.ideaKey === input.ideaKey
  );

  if (!item) {
    return {
      ok: false,
      reason: "no_match",
      error:
        `Dispatch ${input.dispatchId} is no longer actionable in the operator inbox.`,
    };
  }

  const now = input.now ?? new Date();
  const decidedAt = now.toISOString();

  if (input.decision === "defer") {
    const deferUntil = addDays(now, input.deferDays ?? 7).toISOString();
    await appendProcessImprovementsDecisionEvent(
      {
        ideaKey: item.ideaKey,
        dispatchId: item.dispatchId,
        business: item.business,
        decision: "defer",
        actorId: input.actor.id,
        actorName: input.actor.name,
        decidedAt,
        deferUntil,
        sourcePath: item.sourcePath,
        queueMode: item.queueMode,
      },
      repoRoot
    );

    return {
      ok: true,
      decision: "defer",
      dispatchId: item.dispatchId,
      ideaKey: item.ideaKey,
      deferUntil,
    };
  }

  await appendProcessImprovementsDecisionEvent(
    {
      ideaKey: item.ideaKey,
      dispatchId: item.dispatchId,
      business: item.business,
      decision: input.decision,
      actorId: input.actor.id,
      actorName: input.actor.name,
      decidedAt,
      executionResult: "pending",
      sourcePath: item.sourcePath,
      queueMode: item.queueMode,
    },
    repoRoot
  );

  const actionResult =
    input.decision === "do"
      ? handoffQueuedIdeaToRegularProcess({
          dispatchId: item.dispatchId,
          queueStatePath: queuePath.relativePath,
          actorId: input.actor.id,
          actorName: input.actor.name,
          rootDir: repoRoot,
          clock: () => now,
        })
      : declineQueuedIdea({
          dispatchId: item.dispatchId,
          queueStatePath: queuePath.relativePath,
          actorId: input.actor.id,
          actorName: input.actor.name,
          rootDir: repoRoot,
          clock: () => now,
        });

  if (!actionResult.ok) {
    await appendProcessImprovementsDecisionEvent(
      {
        ideaKey: item.ideaKey,
        dispatchId: item.dispatchId,
        business: item.business,
        decision: input.decision,
        actorId: input.actor.id,
        actorName: input.actor.name,
        decidedAt: now.toISOString(),
        executionResult: "failed",
        executionError: actionResult.error ?? actionResult.reason,
        sourcePath: item.sourcePath,
        queueMode: item.queueMode,
      },
      repoRoot
    );

    return {
      ok: false,
      reason:
        actionResult.reason === "parse_error" ||
        actionResult.reason === "file_not_found"
          ? "write_error"
          : actionResult.reason,
      error:
        actionResult.error ??
        `Decision ${input.decision} failed for dispatch ${item.dispatchId}.`,
    };
  }

  await appendProcessImprovementsDecisionEvent(
    {
      ideaKey: item.ideaKey,
      dispatchId: item.dispatchId,
      business: item.business,
      decision: input.decision,
      actorId: input.actor.id,
      actorName: input.actor.name,
      decidedAt: now.toISOString(),
      executionResult: "succeeded",
      sourcePath: item.sourcePath,
      queueMode: item.queueMode,
    },
    repoRoot
  );

  return {
    ok: true,
    decision: input.decision,
    dispatchId: item.dispatchId,
    ideaKey: item.ideaKey,
    targetPath: "targetPath" in actionResult ? actionResult.targetPath : undefined,
    targetRoute: "targetRoute" in actionResult ? actionResult.targetRoute : undefined,
  };
}
