"use client";

import { useEffect, useMemo, useState } from "react";

import { Cluster, Stack } from "@acme/design-system/primitives";

import PipelineMap2D from "./PipelineMap2D";
import PipelineMap3D from "./PipelineMap3D";
import type { PipelineStage } from "./pipelineMapConfig";

type MapMode = "2d" | "3d";

const MAP_MODE_STORAGE_KEY = "pp_command_deck_map_mode_v1";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("experimental-webgl", { failIfMajorPerformanceCaveat: true });
    return Boolean(gl);
  } catch {
    return false;
  }
}

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (!("matchMedia" in window)) return false;
  // eslint-disable-next-line ds/no-hardcoded-copy -- PP-001 media query string, not user-facing
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readStoredMode(): MapMode | null {
  try {
    const raw = window.localStorage.getItem(MAP_MODE_STORAGE_KEY);
    if (raw === "2d" || raw === "3d") return raw;
    return null;
  } catch {
    return null;
  }
}

function writeStoredMode(mode: MapMode): void {
  try {
    window.localStorage.setItem(MAP_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export default function PipelineMapPanel({
  strings,
  stageCounts,
}: {
  strings: {
    label: string;
    title: string;
    hint: string;
    mode2d: string;
    mode3d: string;
    nodes: Record<PipelineStage, string>;
  };
  stageCounts: Record<string, number>;
}) {
  const [mode, setMode] = useState<MapMode>("3d");
  const [can3d, setCan3d] = useState(false);
  const prefersReducedMotion = useMemo(() => getPrefersReducedMotion(), []);

  useEffect(() => {
    const stored = readStoredMode();
    const webgl = supportsWebGL();
    setCan3d(webgl);

    if (stored) {
      setMode(stored);
      return;
    }

    setMode(webgl && !prefersReducedMotion ? "3d" : "2d");
  }, [prefersReducedMotion]);

  useEffect(() => {
    writeStoredMode(mode);
  }, [mode]);

  const effectiveMode: MapMode = can3d ? mode : "2d";

  return (
    <section className="pp-card p-6">
      <Cluster justify="between" alignY="start" className="gap-4">
        <Stack gap={2}>
          <span className="text-xs uppercase tracking-widest text-foreground/60">
            {strings.label}
          </span>
          <h2 className="text-xl font-semibold tracking-tight">{strings.title}</h2>
        </Stack>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pp-chip">{strings.hint}</span>
{/* eslint-disable ds/no-hardcoded-copy -- PP-001 CSS class strings, not user-facing copy */}
          <div className="inline-flex items-center gap-1 rounded-full border border-border-1 bg-surface-2 p-1 text-xs">
            <button
              type="button"
              className={`rounded-full px-3 py-1 font-semibold ${
                effectiveMode === "2d"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-surface-3"
              }`}
              onClick={() => setMode("2d")}
              aria-pressed={effectiveMode === "2d"}
            >
              {strings.mode2d}
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 font-semibold ${
                effectiveMode === "3d"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
              }`}
              onClick={() => setMode("3d")}
              aria-pressed={effectiveMode === "3d"}
              disabled={!can3d}
              // i18n-exempt -- PP-001 [ttl=2027-01-01] internal admin tool tooltip
              title={!can3d ? "WebGL not available" : undefined}
            >
              {strings.mode3d}
            </button>
          </div>
          {/* eslint-enable ds/no-hardcoded-copy */}
        </div>
      </Cluster>

      <div className="mt-6">
        {effectiveMode === "3d" ? (
          <PipelineMap3D
            stageCounts={stageCounts}
            reduceMotion={prefersReducedMotion}
            nodeLabels={strings.nodes}
          />
        ) : (
          <PipelineMap2D stageCounts={stageCounts} nodeLabels={strings.nodes} />
        )}
      </div>
    </section>
  );
}
