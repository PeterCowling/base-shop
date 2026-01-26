"use client";

import Link from "next/link";

import { Grid, Stack } from "@acme/design-system/primitives";

import type { GameEvent } from "../types";

function formatAge(value: string | null | undefined): string | null {
  if (!value) return null;
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return null;
  const diffMs = Math.max(0, Date.now() - ts);
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export default function BattleLogPanel({
  strings,
  events,
}: {
  strings: {
    label: string;
    title: string;
    empty: string;
  };
  events: GameEvent[];
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
      </Stack>

      {events.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/70">{strings.empty}</p>
      ) : (
        <Grid cols={1} gap={3} className="mt-6">
          {events.slice(0, 12).map((event) => {
            const age = formatAge(event.createdAt);
            const stage = event.stage ?? "?";
            const status = event.status ?? "unknown";
            const title = event.leadTitle ?? "Candidate";
            const href = event.candidateId ? `/candidates/${event.candidateId}` : "/activity";
            return (
              <Link
                key={event.id}
                href={href}
                className="rounded-2xl border border-border-1 bg-surface-2 p-3 text-sm transition hover:bg-surface-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="pp-chip">{stage}</span>
                    <span className="font-semibold text-foreground">{title}</span>
                  </div>
                  <span className="text-xs text-foreground/60">
                    {age ? `${status} · ${age}` : status}
                  </span>
                </div>
              </Link>
            );
          })}
        </Grid>
      )}
    </section>
  );
}
