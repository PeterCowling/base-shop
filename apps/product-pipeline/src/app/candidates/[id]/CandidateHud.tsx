"use client";

import { useMemo } from "react";
import { Grid, Stack } from "@acme/design-system/primitives";

import { extractStageRSummary } from "./stageRHelpers";
import { extractStageSSummary } from "./stageSHelpers";
import { extractStageTSummary } from "./stageTHelpers";
import type {
  CandidateDetail,
  CandidateDetailStrings,
  StageRun,
} from "./types";

const CONFIDENCE_MAX = 100;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function resolveStageRun(stageRuns: StageRun[], stage: string): StageRun | null {
  return stageRuns.find((run) => run.stage === stage) ?? null;
}

function resolveBandLabel(
  band: string | null | undefined,
  labels: { low: string; medium: string; high: string; unknown: string },
): string {
  if (!band) return labels.unknown;
  const normalized = band.toLowerCase();
  if (normalized === "low") return labels.low;
  if (normalized === "medium") return labels.medium;
  if (normalized === "high") return labels.high;
  return labels.unknown;
}

type NextActionStrings = {
  needStageM: string;
  needStageB: string;
  needStageC: string;
  needStageT: string;
  needStageS: string;
  needStageK: string;
  needStageR: string;
  reviewCompliance: string;
  ready: string;
};

function computeConfidence({
  stageRuns,
  cooldownActive,
}: {
  stageRuns: StageRun[];
  cooldownActive: boolean;
}): number {
  let score = 0;
  const stageM = stageRuns.find((run) => run.stage === "M" && run.status === "succeeded");
  const stageT = stageRuns.find((run) => run.stage === "T" && run.status === "succeeded");
  const stageB = stageRuns.find((run) => run.stage === "B" && run.status === "succeeded");
  const stageC = stageRuns.find((run) => run.stage === "C" && run.status === "succeeded");
  const stageS = stageRuns.find((run) => run.stage === "S" && run.status === "succeeded");
  const stageK = stageRuns.find((run) => run.stage === "K" && run.status === "succeeded");
  const stageR = stageRuns.find((run) => run.stage === "R" && run.status === "succeeded");

  if (stageM) score += 20;
  if (stageT) score += 10;
  if (stageB) score += 20;
  if (stageC) score += 15;
  if (stageS) score += 15;
  if (stageK) score += 15;
  if (stageR) score += 10;

  const stageTSummary = extractStageTSummary(stageT ?? undefined);
  if (stageTSummary?.decision === "blocked") score -= 25;
  if (stageTSummary?.decision === "needs_review") score -= 10;

  if (cooldownActive) score -= 20;

  return clamp(score, 0, CONFIDENCE_MAX);
}

function resolveNextAction(
  stageRuns: StageRun[],
  strings: NextActionStrings,
): string {
  const hasStageM = stageRuns.some((run) => run.stage === "M" && run.status === "succeeded");
  const stageT = stageRuns.find((run) => run.stage === "T" && run.status === "succeeded");
  const hasStageB = stageRuns.some((run) => run.stage === "B" && run.status === "succeeded");
  const hasStageC = stageRuns.some((run) => run.stage === "C" && run.status === "succeeded");
  const hasStageS = stageRuns.some((run) => run.stage === "S" && run.status === "succeeded");
  const hasStageK = stageRuns.some((run) => run.stage === "K" && run.status === "succeeded");
  const hasStageR = stageRuns.some((run) => run.stage === "R" && run.status === "succeeded");

  if (!hasStageM) return strings.needStageM;
  if (!stageT) return strings.needStageT;
  const stageTSummary = extractStageTSummary(stageT);
  if (stageTSummary?.decision === "blocked" || stageTSummary?.decision === "needs_review") {
    return strings.reviewCompliance;
  }
  if (!hasStageB) return strings.needStageB;
  if (!hasStageC) return strings.needStageC;
  if (!hasStageS) return strings.needStageS;
  if (!hasStageK) return strings.needStageK;
  if (!hasStageR) return strings.needStageR;
  return strings.ready;
}

export default function CandidateHud({
  candidate,
  stageRuns,
  strings,
}: {
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  strings: CandidateDetailStrings["hud"];
}) {
  const metrics = useMemo(() => {
    const stageK = resolveStageRun(stageRuns, "K");
    const stageS = resolveStageRun(stageRuns, "S");
    const stageR = resolveStageRun(stageRuns, "R");
    const stageKSummary =
      stageK?.output && typeof stageK.output === "object"
        ? (stageK.output as { summary?: { returnBand?: string } }).summary
        : null;
    const stageSSummary = extractStageSSummary(stageS ?? undefined);
    const stageRSummary = extractStageRSummary(stageR ?? undefined);
    const returnBandLabel = resolveBandLabel(
      stageKSummary?.returnBand ?? null,
      strings.returnBands,
    );
    const riskBandLabel = resolveBandLabel(
      stageRSummary?.riskBand ?? stageSSummary?.overallRisk ?? null,
      strings.riskBands,
    );
    const effortBandLabel = resolveBandLabel(
      stageRSummary?.effortBand ?? null,
      strings.effortBands,
    );
    const confidence = computeConfidence({
      stageRuns,
      cooldownActive: Boolean(candidate?.cooldown?.active),
    });
    const nextAction = resolveNextAction(stageRuns, strings.nextActions);

    return {
      returnBandLabel,
      riskBandLabel,
      effortBandLabel,
      confidence,
      nextAction,
    };
  }, [candidate?.cooldown?.active, stageRuns, strings]);

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
      </Stack>
      <Grid cols={1} gap={3} className="mt-4 md:grid-cols-5">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">{strings.returnLabel}</div>
          <div className="mt-1 text-sm font-semibold">
            {metrics.returnBandLabel}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">{strings.riskLabel}</div>
          <div className="mt-1 text-sm font-semibold">{metrics.riskBandLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">{strings.effortLabel}</div>
          <div className="mt-1 text-sm font-semibold">{metrics.effortBandLabel}</div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">{strings.confidenceLabel}</div>
          <div className="mt-1 text-sm font-semibold">
            {metrics.confidence}%
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <div className="text-xs text-foreground/60">{strings.nextLabel}</div>
          <div className="mt-1 text-sm font-semibold">{metrics.nextAction}</div>
        </div>
      </Grid>
    </section>
  );
}
