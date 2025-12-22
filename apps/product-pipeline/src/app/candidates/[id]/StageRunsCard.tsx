"use client";

import { Grid, Stack, Cluster } from "@ui/components/atoms/primitives";
import type { CandidateDetailStrings, StageRun } from "./types";
import { safeTimestamp, stringifyPayload } from "./types";

export default function StageRunsCard({
  stageRuns,
  strings,
}: {
  stageRuns: StageRun[];
  strings: CandidateDetailStrings;
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.stageRuns.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.stageRuns.title}
        </h2>
      </Stack>
      <Stack gap={3} className="mt-4 text-sm">
        {stageRuns.length === 0 ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-foreground/60">
            {strings.notAvailable}
          </div>
        ) : (
          stageRuns.map((run) => (
            <div
              key={run.id}
              className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
            >
              <Cluster justify="between" alignY="center" className="gap-4">
                <Stack gap={1}>
                  <span className="text-xs text-foreground/60">
                    {strings.stageRuns.stageLabel}: {run.stage}
                  </span>
                  <span className="text-sm font-semibold">
                    {strings.stageRuns.statusLabel}: {run.status}
                  </span>
                </Stack>
                <span className="text-xs text-foreground/60">
                  {strings.stageRuns.createdLabel}:{" "}
                  {safeTimestamp(run.createdAt, strings.notAvailable)}
                </span>
              </Cluster>
              <Grid cols={1} gap={3} className="mt-3 md:grid-cols-3">
                <div className="text-xs text-foreground/60">
                  {strings.stageRuns.startedLabel}:{" "}
                  {safeTimestamp(run.startedAt, strings.notAvailable)}
                </div>
                <div className="text-xs text-foreground/60">
                  {strings.stageRuns.finishedLabel}:{" "}
                  {safeTimestamp(run.finishedAt, strings.notAvailable)}
                </div>
                <div className="text-xs text-foreground/60">
                  {strings.stageRuns.statusLabel}: {run.status}
                </div>
              </Grid>
              <Grid cols={1} gap={3} className="mt-3 md:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-foreground/60">
                    {strings.stageRuns.inputLabel}
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-1 p-3 text-xs text-foreground/70">
                    {stringifyPayload(run.input) || strings.notAvailable}
                  </pre>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-foreground/60">
                    {strings.stageRuns.outputLabel}
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-1 p-3 text-xs text-foreground/70">
                    {stringifyPayload(run.output) || strings.notAvailable}
                  </pre>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-foreground/60">
                    {strings.stageRuns.errorLabel}
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-surface-1 p-3 text-xs text-foreground/70">
                    {stringifyPayload(run.error) || strings.notAvailable}
                  </pre>
                </div>
              </Grid>
            </div>
          ))
        )}
      </Stack>
    </section>
  );
}
