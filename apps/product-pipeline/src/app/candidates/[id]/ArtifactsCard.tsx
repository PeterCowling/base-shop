/* eslint-disable ds/min-tap-size -- PP-1310 [ttl=2026-12-31] Pending DS token rollout for controls */
"use client";

import { Stack } from "@ui/components/atoms/primitives";
import { useState } from "react";
import type { Artifact, CandidateDetailStrings } from "./types";
import { resolveArtifactHref, safeTimestamp } from "./types";

function resolveArtifactKindLabel(
  kind: string | null,
  strings: CandidateDetailStrings["artifacts"],
  fallback: string,
): string {
  if (!kind) return fallback;
  switch (kind) {
    case "snapshot_html":
      return strings.kindSnapshotHtml;
    case "snapshot_png":
      return strings.kindSnapshotPng;
    default:
      return kind;
  }
}

export default function ArtifactsCard({
  artifacts,
  strings,
}: {
  artifacts: Artifact[];
  strings: CandidateDetailStrings;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="pp-card p-6">
      <Stack gap={2}>
        <span className="text-xs uppercase tracking-widest text-foreground/60">
          {strings.artifacts.label}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">
          {strings.artifacts.title}
        </h2>
      </Stack>
      <div className="mt-4">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? strings.common.hideDetails : strings.common.showDetails}
        </button>
      </div>
      {expanded ? (
        <Stack gap={3} className="mt-4 text-sm">
          {artifacts.length === 0 ? (
            <div className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3 text-foreground/60">
              {strings.notAvailable}
            </div>
          ) : (
            artifacts.map((artifact) => {
              const href = resolveArtifactHref(artifact.uri);
              const kindLabel = resolveArtifactKindLabel(
                artifact.kind ?? null,
                strings.artifacts,
                strings.notAvailable,
              );
              return (
                <div
                  key={artifact.id}
                  className="rounded-2xl border border-border-1 bg-surface-2 px-4 py-3"
                >
                  <div className="text-xs text-foreground/60">
                    {strings.artifacts.kindLabel}:{" "}
                    <span className="text-foreground">{kindLabel}</span>
                  </div>
                  <div className="mt-2 text-xs text-foreground/60">
                    {strings.artifacts.uriLabel}:{" "}
                    {href ? (
                      <a
                        className="inline-flex min-h-12 min-w-12 items-center justify-center text-primary underline"
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {strings.artifacts.openLabel}
                      </a>
                    ) : (
                      <span className="text-foreground">
                        {artifact.uri ?? strings.notAvailable}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-foreground/60">
                    {strings.artifacts.createdLabel}:{" "}
                    <span className="text-foreground">
                      {safeTimestamp(artifact.createdAt, strings.notAvailable)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </Stack>
      ) : null}
    </section>
  );
}
