"use client";

import { Stack } from "@acme/ui/components/atoms/primitives";
import type { RunnerStatus } from "../types";

function formatRunnerAge(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return fallback;
  const diffMs = Math.max(0, Date.now() - timestamp);
  if (diffMs < 1000) return "now";
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h`;
}

export default function RunnerPanel({
  strings,
  runner,
  loading,
  notAvailable,
}: {
  strings: {
    label: string;
    title: string;
    statusLabel: string;
    statusReady: string;
    statusStale: string;
    statusUnknown: string;
    lastSeenLabel: string;
    modeLabel: string;
    browserLabel: string;
    sessionLabel: string;
  };
  runner: RunnerStatus | null;
  loading: boolean;
  notAvailable: string;
}) {
  const statusText = runner
    ? runner.stale
      ? strings.statusStale
      : strings.statusReady
    : strings.statusUnknown;

  const statusTone = runner
    ? runner.stale
      ? "text-amber-600"
      : "text-emerald-600"
    : "text-foreground/60";

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
        <div className="mt-2 rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm">
          <div className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.statusLabel}
          </div>
          <div className={`mt-1 font-semibold ${statusTone}`}>
            {loading && !runner ? "Checking…" : statusText}
          </div>
          <div className="mt-3 grid gap-2 text-xs text-foreground/70">
            <div>
              <span className="text-foreground/60">{strings.lastSeenLabel}:</span>{" "}
              <span className="font-semibold text-foreground">
                {runner?.lastSeen
                  ? formatRunnerAge(runner.lastSeen, notAvailable)
                  : notAvailable}
              </span>
            </div>
            <div>
              <span className="text-foreground/60">{strings.modeLabel}:</span>{" "}
              <span className="font-semibold text-foreground">
                {runner?.mode ?? notAvailable}
              </span>
            </div>
            <div>
              <span className="text-foreground/60">{strings.browserLabel}:</span>{" "}
              <span className="font-semibold text-foreground">
                {runner?.headless === null || runner?.headless === undefined
                  ? notAvailable
                  : runner.headless
                    ? "headless"
                    : "headed"}
              </span>
            </div>
            <div>
              <span className="text-foreground/60">{strings.sessionLabel}:</span>{" "}
              <span className="font-semibold text-foreground">
                {runner?.sessionProfile ?? notAvailable}
              </span>
            </div>
          </div>
        </div>
      </Stack>
    </section>
  );
}
