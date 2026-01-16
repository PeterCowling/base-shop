"use client";

import { Grid, Stack } from "@ui/components/atoms/primitives";
import type { GameAchievement } from "../types";

type AchievementsStrings = {
  label: string;
  title: string;
  [key: string]: unknown;
};

type AchievementCopy = {
  title: string;
  description: string;
};

function safeCopy(value: unknown): AchievementCopy | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record["title"] !== "string" ||
    typeof record["description"] !== "string"
  ) {
    return null;
  }
  return { title: record["title"], description: record["description"] };
}

function clampProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

export default function AchievementsPanel({
  strings,
  achievements,
}: {
  strings: Record<string, unknown>;
  achievements: GameAchievement[];
}) {
  const s = strings as AchievementsStrings;

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {s.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
      </Stack>

      <Grid cols={1} gap={4} className="mt-6">
        {achievements.map((achievement) => {
          const copy = safeCopy(s[achievement.id]) ?? {
            title: achievement.id,
            description: "",
          };
          const target = clampProgress(achievement.target);
          const progress = Math.min(target || 0, clampProgress(achievement.progress));
          const ratio = target > 0 ? Math.min(1, progress / target) : 0;
          const pct = Math.round(ratio * 100);

          return (
            <div
              key={achievement.id}
              className="rounded-2xl border border-border-1 bg-surface-2 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold tracking-tight">
                    {copy.title}
                  </div>
                  {copy.description && (
                    <div className="mt-1 text-xs text-foreground/70">
                      {copy.description}
                    </div>
                  )}
                </div>
                <span className="pp-chip">
                  {achievement.unlocked ? "Unlocked" : `${pct}%`}
                </span>
              </div>

              <div className="mt-3">
                <div className="pp-hud-bar" aria-hidden="true">
                  <div className="pp-hud-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-foreground/60">
                  <span>
                    {progress}/{target}
                  </span>
                  <span className="font-semibold text-foreground">
                    {achievement.unlocked ? "✓" : ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </Grid>
    </section>
  );
}
