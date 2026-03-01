"use client";

import type React from "react";

import type { Metrics, Trigger } from "./brandMarkTypes";

export function buildBrandInlineStyle(params: {
  durationMs: number;
  shouldAnimate: boolean;
  metrics: Metrics | null;
}): React.CSSProperties {
  const { durationMs, shouldAnimate, metrics } = params;
  const base: React.CSSProperties = {
    "--dur": `${durationMs}ms`,
    "--tagline-reveal": shouldAnimate ? 0 : 1,
  } as React.CSSProperties;

  if (!metrics) {
    return base;
  }

  return {
    ...base,
    "--pos-y": `${metrics.posY}px`,
    "--pos-i-final": `${metrics.posIFinal}px`,
    "--shift": `${metrics.shift}px`,
  } as React.CSSProperties;
}

export function resolveFallbackText(shouldAnimate: boolean, trigger: Trigger): string {
  return shouldAnimate && trigger === "mount" ? "Caryina" : "Carina";
}
