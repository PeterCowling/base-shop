"use client";

import { useCallback, useState } from "react";
import { Cluster, Stack } from "@acme/design-system/primitives";

import { type FullEvalStatus,runFullEvaluation as runFullEvaluationRequest } from "../fullEvaluation";

import type { CandidateDetail, CandidateDetailStrings, StageRun } from "./types";

type StageStatus = {
  status: string | null;
  createdAt: string | null;
};

export default function FullEvaluationCard({
  candidateId,
  candidate,
  stageRuns,
  strings,
  onRun,
}: {
  candidateId: string;
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  strings: CandidateDetailStrings;
  onRun: () => Promise<void>;
}) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<FullEvalStatus | null>(null);
  const cooldownActive = Boolean(candidate?.cooldown?.active);

  const resolveLatestStatus = useCallback(
    (stage: string): StageStatus => {
      const latest = stageRuns
        .filter((run) => run.stage === stage)
        .sort((a, b) => (a.createdAt && b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0))[0];
      return {
        status: latest?.status ?? null,
        createdAt: latest?.createdAt ?? null,
      };
    },
    [stageRuns],
  );

  const handleRunFullEvaluation = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setMessage(null);
    setStatus(null);
    const latestStageT = stageRuns.find(
      (run) => run.stage === "T" && run.status === "succeeded",
    );
    const latestStageS = stageRuns.find(
      (run) => run.stage === "S" && run.status === "succeeded",
    );
    const stageTDecision =
      latestStageT?.output && typeof latestStageT.output === "object"
        ? (latestStageT.output as { summary?: { decision?: string } }).summary
            ?.decision ?? null
        : null;
    const stageSOutput =
      latestStageS?.output && typeof latestStageS.output === "object"
        ? (latestStageS.output as { summary?: { overallRisk?: string; action?: string } })
            .summary ?? null
        : null;

    const nextStatus = await runFullEvaluationRequest({
      candidateId,
      lead: candidate?.lead ?? null,
      statuses: {
        M: resolveLatestStatus("M").status,
        A: resolveLatestStatus("A").status,
        B: resolveLatestStatus("B").status,
        C: resolveLatestStatus("C").status,
        K: resolveLatestStatus("K").status,
      },
      stageLabels: strings.stageLabels,
      gateContext: {
        eligibilityDecision: stageTDecision,
        complianceRisk: stageSOutput?.overallRisk ?? null,
        complianceAction: stageSOutput?.action ?? null,
      },
    });

    setStatus(nextStatus);
    setMessage(nextStatus.missing.length > 0 ? strings.fullEval.error : strings.fullEval.success);
    setRunning(false);
    await onRun();
  }, [candidate, candidateId, onRun, resolveLatestStatus, running, stageRuns, strings]);

  const disabled = running || cooldownActive || !candidate;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.fullEval.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.fullEval.title}
        </h2>
        <p className="text-sm text-foreground/70">{strings.fullEval.body}</p>
      </Stack>
      <Cluster justify="between" alignY="center" className="mt-4 gap-3">
        <span className="text-xs text-foreground/60">
          {message ??
            (cooldownActive ? strings.cooldown.activeMessage : strings.fullEval.ready)}
        </span>
        <button
          type="button"
          className="min-h-12 min-w-12 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void handleRunFullEvaluation()}
          disabled={disabled}
        >
          {running ? strings.fullEval.running : strings.fullEval.run}
        </button>
      </Cluster>
      {status ? (
        <Stack gap={2} className="mt-4 text-xs text-foreground/70">
          {status.queued.length > 0 ? (
            <span>
              {strings.fullEval.statusQueued}: {status.queued.join(", ")}
            </span>
          ) : null}
          {status.ran.length > 0 ? (
            <span>
              {strings.fullEval.statusRan}: {status.ran.join(", ")}
            </span>
          ) : null}
          {status.skipped.length > 0 ? (
            <span>
              {strings.fullEval.statusSkipped}: {status.skipped.join(", ")}
            </span>
          ) : null}
          {status.missing.length > 0 ? (
            <span>
              {strings.fullEval.statusMissing}: {status.missing.join(", ")}
            </span>
          ) : null}
        </Stack>
      ) : null}
    </section>
  );
}
