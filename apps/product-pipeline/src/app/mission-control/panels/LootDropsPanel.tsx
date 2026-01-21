"use client";

import Link from "next/link";
import { Grid, Inline, Stack } from "@acme/ui/components/atoms/primitives";

import { resolveArtifactHref } from "@/app/artifacts/types";

import type { GameLootDrop } from "../types";

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

export default function LootDropsPanel({
  strings,
  loot,
}: {
  strings: {
    label: string;
    title: string;
    empty: string;
    openArtifact: string;
  };
  loot: GameLootDrop[];
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
      </Stack>

      {loot.length === 0 ? (
        <p className="mt-6 text-sm text-foreground/70">{strings.empty}</p>
      ) : (
        <Grid cols={1} gap={3} className="mt-6">
          {loot.slice(0, 10).map((drop) => {
            const href = resolveArtifactHref(drop.uri);
            const age = formatAge(drop.createdAt);
            const stage = drop.stage ?? "?";
            const title = drop.leadTitle ?? "Artifact";
            return (
              <div
                key={drop.id}
                className="rounded-2xl border border-border-1 bg-surface-2 p-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="pp-chip">{stage}</span>
                    <span className="font-semibold text-foreground">{title}</span>
                  </div>
                  <span className="text-xs text-foreground/60">{age ?? ""}</span>
                </div>

                <Inline gap={3} alignY="center" className="mt-2 justify-between text-xs text-foreground/60">
                  <span>{drop.kind ?? "-"}</span>
                  <Inline gap={2} alignY="center">
                    {drop.candidateId && (
                      <Link
                        href={`/candidates/${drop.candidateId}`}
                        className="text-primary hover:underline"
                      >
                        Candidate
                      </Link>
                    )}
                    {href && (
                      <a
                        href={href}
                        className="rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {strings.openArtifact}
                      </a>
                    )}
                  </Inline>
                </Inline>
              </div>
            );
          })}
        </Grid>
      )}
    </section>
  );
}
