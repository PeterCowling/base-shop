"use client";

/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */

import { useMemo, useState } from "react";
import { Cluster, Stack } from "@acme/ui/components/atoms/primitives";

import { resolveStageLabel } from "@/lib/stage-labels";

import { resolveStageTSGate } from "./stageGate";
import type {
  CandidateDetail,
  CandidateDetailStrings,
  StageRun,
} from "./types";

type NextStep =
  | { kind: "cooldown"; label: string; href: string; helper?: string }
  | { kind: "gate-eligibility"; label: string; href: string; helper?: string }
  | { kind: "gate-compliance"; label: string; href: string; helper?: string }
  | { kind: "missing"; label: string; href: string; helper?: string };

function latestSucceeded(stageRuns: StageRun[], stage: string): StageRun | null {
  return stageRuns.find((run) => run.stage === stage && run.status === "succeeded") ?? null;
}

const stageHref: Record<string, string> = {
  M: "#stage-m",
  T: "#stage-t",
  S: "#stage-s",
  B: "#stage-b",
  C: "#stage-c",
  K: "#stage-k",
  R: "#stage-r",
  COOL: "#cooldown",
};

function formatRecheck(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed).toLocaleDateString("en-GB");
}

export default function NextStepPanel({
  candidate,
  stageRuns,
  strings,
}: {
  candidate: CandidateDetail | null;
  stageRuns: StageRun[];
  strings: CandidateDetailStrings;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const step = useMemo<NextStep | null>(() => {
    if (candidate?.cooldown?.active) {
      return {
        kind: "cooldown",
        label: strings.nextStep.resolveCooldown,
        href: stageHref["COOL"] ?? "#cooldown",
        helper: candidate.cooldown.reasonCode ?? undefined,
      };
    }
    const gate = resolveStageTSGate(stageRuns);
    if (gate === "stage_t_blocked" || gate === "stage_t_needs_review") {
      return {
        kind: "gate-eligibility",
        label: strings.nextStep.resolveEligibility,
        href: stageHref["T"] ?? "#stage-t",
      };
    }
    if (gate === "stage_s_blocked") {
      return {
        kind: "gate-compliance",
        label: strings.nextStep.resolveCompliance,
        href: stageHref["S"] ?? "#stage-s",
      };
    }
    const order = ["M", "T", "S", "B", "C", "K", "R"];
    const missing = order.find((code) => !latestSucceeded(stageRuns, code));
    if (missing) {
      return {
        kind: "missing",
        label: `${strings.nextStep.fillMissing}: ${resolveStageLabel(
          missing,
          strings.stageLabels,
          missing,
        )}`,
        href: stageHref[missing] ?? "#",
      };
    }
    return null;
  }, [
    candidate?.cooldown?.active,
    candidate?.cooldown?.reasonCode,
    stageRuns,
    strings.nextStep,
    strings.stageLabels,
  ]);

  if (!step) return null;

  const gate = resolveStageTSGate(stageRuns);
  const gateMessage =
    gate === "stage_t_blocked"
      ? strings.gates.stageTBlocked
      : gate === "stage_t_needs_review"
        ? strings.gates.stageTNeedsReview
        : gate === "stage_s_blocked"
          ? strings.gates.stageSBlocked
          : null;
  const gateAction =
    gate === "stage_s_blocked"
      ? strings.nextStep.resolveCompliance
      : gate
        ? strings.nextStep.resolveEligibility
        : null;
  const gateWhy =
    gate === "stage_s_blocked"
      ? strings.gates.whyStageS
      : gate
        ? strings.gates.whyStageT
        : null;
  const cooldownRecheck = formatRecheck(candidate?.cooldown?.recheckAfter ?? null);

  return (
    <section className="pp-card p-4 border border-border-2 bg-surface-2">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.nextStep.label}
        </span>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {strings.nextStep.title}
            </h2>
            {gateMessage ? (
              <Stack gap={1} className="mt-2 text-sm text-foreground/70">
                <div>
                  <span className="text-xs uppercase tracking-widest text-foreground/60">
                    {strings.gates.blockingLabel}
                  </span>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {gateMessage}
                  </div>
                </div>
                {gateAction ? (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-foreground/60">
                      {strings.gates.actionLabel}
                    </span>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {gateAction}
                    </div>
                  </div>
                ) : null}
              </Stack>
            ) : step.kind === "cooldown" ? (
              <Stack gap={1} className="mt-2 text-sm text-foreground/70">
                <div>
                  <span className="text-xs uppercase tracking-widest text-foreground/60">
                    {strings.cooldown.activeLabel}
                  </span>
                  <div className="mt-1 text-sm font-semibold text-foreground">
                    {strings.cooldown.activeMessage}
                  </div>
                </div>
                {cooldownRecheck ? (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-foreground/60">
                      {strings.cooldown.recheckLabel}
                    </span>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {cooldownRecheck}
                    </div>
                  </div>
                ) : null}
                {step.helper ? (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-foreground/60">
                      {strings.cooldown.reasonLabel}
                    </span>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {step.helper}
                    </div>
                  </div>
                ) : null}
              </Stack>
            ) : (
              step.helper && (
                <p className="mt-1 text-sm text-foreground/70">{step.helper}</p>
              )
            )}
          </div>
          <Cluster gap={2}>
            <a
              href={step.href}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {strings.nextStep.go}
            </a>
            {gate ? (
              <a
                href={gate === "stage_s_blocked" ? "#stage-s" : "#stage-t"}
                className="rounded-full border border-border-2 px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-3"
              >
                {strings.nextStep.viewEvidence}
              </a>
            ) : null}
            {gate ? (
              <button
                type="button"
                className="rounded-full border border-border-2 px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-3"
                onClick={() => setShowWhy((current) => !current)}
              >
                {strings.nextStep.whyBlocked}
              </button>
            ) : null}
          </Cluster>
        </div>
        {gate && showWhy && gateWhy ? (
          <div className="rounded-2xl border border-border-1 bg-surface-1 px-4 py-3 text-sm text-foreground/70">
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.gates.whyLabel}
            </span>
            <p className="mt-2">{gateWhy}</p>
          </div>
        ) : null}
      </Stack>
    </section>
  );
}
