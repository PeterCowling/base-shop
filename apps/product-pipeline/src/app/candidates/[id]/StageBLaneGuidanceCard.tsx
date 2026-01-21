"use client";

import { Stack } from "@acme/ui/components/atoms/primitives";

import type { CandidateDetailStrings } from "./types";

export default function StageBLaneGuidanceCard({
  strings,
}: {
  strings: CandidateDetailStrings["stageB"]["guidance"];
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h3 className="text-lg font-semibold tracking-tight">
          {strings.title}
        </h3>
      </Stack>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.glossaryLabel}
          </div>
          <ul className="mt-2 space-y-2 text-sm text-foreground/70">
            <li>{strings.glossaryFba}</li>
            <li>{strings.glossaryIncoterms}</li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.costTimingLabel}
          </div>
          <div className="mt-2 text-sm text-foreground/70">
            {strings.costTimingText}
          </div>
          <div className="mt-4 text-xs uppercase tracking-widest text-foreground/60">
            {strings.confidenceLabel}
          </div>
          <div className="mt-2 text-sm text-foreground/70">
            {strings.confidenceText}
          </div>
        </div>
      </div>
    </section>
  );
}
