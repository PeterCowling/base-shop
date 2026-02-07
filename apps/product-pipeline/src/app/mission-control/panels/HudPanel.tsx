"use client";

import { Cluster, Grid, Inline, Stack } from "@acme/design-system/primitives";

import type { GameState } from "../types";

function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-GB").format(value);
}

export default function HudPanel({
  strings,
  state,
  loading,
}: {
  strings: {
    label: string;
    title: string;
    levelLabel: string;
    streakLabel: string;
    stageRunsTodayLabel: string;
    leadsNewLabel: string;
    candidatesLabel: string;
    artifactsLabel: string;
    xpLabel: string;
    nextLevelLabel: string;
  };
  state: GameState | null;
  loading: boolean;
}) {
  const operator = state?.operator ?? null;
  const stats = state?.stats ?? null;

  const progressPct =
    Math.round(((operator?.progress ?? 0) * 100 + Number.EPSILON) * 10) / 10;

  return (
    <section className="pp-card p-6">
      <Cluster justify="between" alignY="start" className="gap-4">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
        </Stack>
        <span className="pp-chip">
          {loading ? "Syncing" : operator ? `${operator.title}` : "Offline"}
        </span>
      </Cluster>

      <Grid cols={1} gap={4} className="mt-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
          <Inline gap={3} alignY="center" className="text-xs text-foreground/60">
            <span className="pp-chip">{strings.levelLabel}</span>
            <span className="font-semibold text-foreground">
              {operator ? `L${operator.level}` : "-"}
            </span>
            <span className="text-foreground/60">
              {operator ? `${strings.xpLabel} ${formatCount(operator.xp)}` : ""}
            </span>
          </Inline>
          <div className="mt-3">
            <div className="pp-hud-bar" aria-hidden="true">
              <div className="pp-hud-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-foreground/60">
              <span>{strings.nextLevelLabel}</span>
              <span className="font-semibold text-foreground">
                {operator ? formatCount(operator.nextLevelXp) : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
          <Stack gap={2}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.streakLabel}
            </span>
            <span className="text-2xl font-semibold tracking-tight">
              {operator ? `${operator.streakDays}d` : "-"}
            </span>
            <span className="text-xs text-foreground/60">
              {/* i18n-exempt -- PP-001 [ttl=2027-01-01] internal admin tool */}
              {operator ? "Consecutive run-days" : "No telemetry yet"}
            </span>
          </Stack>
        </div>
      </Grid>

      <Grid cols={1} gap={4} className="mt-6 md:grid-cols-4">
        <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
          <Stack gap={1}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.leadsNewLabel}
            </span>
            <span className="text-xl font-semibold">
              {stats ? formatCount(stats.leadsNew) : "-"}
            </span>
          </Stack>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
          <Stack gap={1}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.candidatesLabel}
            </span>
            <span className="text-xl font-semibold">
              {stats ? formatCount(stats.candidatesTotal) : "-"}
            </span>
          </Stack>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
          <Stack gap={1}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.stageRunsTodayLabel}
            </span>
            <span className="text-xl font-semibold">
              {stats ? formatCount(stats.stageRunsToday) : "-"}
            </span>
          </Stack>
        </div>
        <div className="rounded-2xl border border-border-1 bg-surface-2 p-4">
          <Stack gap={1}>
            <span className="text-xs uppercase tracking-widest text-foreground/60">
              {strings.artifactsLabel}
            </span>
            <span className="text-xl font-semibold">
              {stats ? formatCount(stats.artifactsTotal) : "-"}
            </span>
          </Stack>
        </div>
      </Grid>
    </section>
  );
}
