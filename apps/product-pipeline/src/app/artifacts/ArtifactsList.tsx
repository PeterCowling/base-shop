"use client";

import Link from "next/link";
import { Cluster, Grid, Stack } from "@ui/components/atoms/primitives";
import type { ArtifactEntry, ArtifactsStrings } from "./types";
import { resolveArtifactHref, safeTimestamp } from "./types";

function formatText(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function formatCandidateLabel(
  artifact: ArtifactEntry,
  fallback: string,
): string {
  if (artifact.lead?.title) return artifact.lead.title;
  if (artifact.candidateId) return artifact.candidateId;
  return fallback;
}

export default function ArtifactsList({
  artifacts,
  loading,
  strings,
}: {
  artifacts: ArtifactEntry[];
  loading: boolean;
  strings: ArtifactsStrings;
}) {
  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.list.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.list.title}
        </h2>
      </Stack>
      <Stack gap={4} className="mt-6">
        {loading ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/60">
            {strings.list.loading}
          </div>
        ) : artifacts.length === 0 ? (
          <div className="rounded-2xl border border-border-1 bg-surface-2 p-4 text-sm text-foreground/60">
            {strings.list.empty}
          </div>
        ) : (
          artifacts.map((artifact) => {
            const href = resolveArtifactHref(artifact.uri);
            const candidateLabel = formatCandidateLabel(
              artifact,
              strings.notAvailable,
            );
            const candidateId = artifact.candidateId;
            return (
              <div
                key={artifact.id}
                className="rounded-3xl border border-border-1 bg-surface-2 p-4"
              >
                <Cluster justify="between" alignY="center" className="gap-4">
                  <Stack gap={1}>
                    <span className="text-xs text-foreground/60">
                      {strings.fields.candidate}
                    </span>
                    <span className="text-lg font-semibold">
                      {candidateLabel}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {strings.fields.stage}: {formatText(artifact.stage, strings.notAvailable)}
                    </span>
                  </Stack>
                  <Stack gap={2} className="items-end text-xs">
                    {candidateId ? (
                      <Link
                        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-border-2 px-3 py-1"
                        href={`/candidates/${candidateId}`}
                      >
                        {strings.actions.viewCandidate}
                      </Link>
                    ) : null}
                    {href ? (
                      <a
                        className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-border-2 px-3 py-1 text-primary"
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {strings.actions.open}
                      </a>
                    ) : null}
                  </Stack>
                </Cluster>

                <Grid cols={1} gap={3} className="mt-4 text-sm md:grid-cols-3">
                  <div>
                    <div className="text-xs text-foreground/60">
                      {strings.fields.kind}
                    </div>
                    <div className="font-semibold">
                      {formatText(artifact.kind, strings.notAvailable)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60">
                      {strings.fields.created}
                    </div>
                    <div className="font-semibold">
                      {safeTimestamp(artifact.createdAt, strings.notAvailable)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-foreground/60">
                      {strings.fields.uri}
                    </div>
                    <div className="font-semibold break-all">
                      {formatText(artifact.uri, strings.notAvailable)}
                    </div>
                  </div>
                </Grid>
              </div>
            );
          })
        )}
      </Stack>
    </section>
  );
}
