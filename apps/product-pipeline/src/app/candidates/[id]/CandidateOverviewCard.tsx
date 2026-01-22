"use client";

import { Stack } from "@acme/design-system/primitives";

import { formatStageStatus } from "@/lib/stage-labels";

import type { CandidateDetail, CandidateDetailStrings } from "./types";

export default function CandidateOverviewCard({
  candidate,
  strings,
}: {
  candidate: CandidateDetail | null;
  strings: CandidateDetailStrings;
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.overview.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.overview.title}
        </h2>
      </Stack>
      <Stack gap={3} className="mt-4 text-sm">
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.candidateId}
          </span>
          <div className="font-mono text-xs text-foreground/70">
            {candidate?.id ?? strings.notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.stageStatus}
          </span>
          <div className="text-sm font-semibold">
            {formatStageStatus(
              candidate?.stageStatus,
              strings.stageLabels,
              strings.notAvailable,
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.decision}
          </span>
          <div className="text-sm font-semibold">
            {candidate?.decision ?? strings.notAvailable}
          </div>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3">
          <span className="text-xs text-foreground/60">
            {strings.fields.decisionReason}
          </span>
          <div className="text-sm font-semibold">
            {candidate?.decisionReason ?? strings.notAvailable}
          </div>
        </div>
      </Stack>
    </section>
  );
}
