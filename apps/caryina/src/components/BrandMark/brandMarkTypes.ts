import type React from "react";

import type { ParticlePhase } from "./particleEngine";

export type Trigger = "mount" | "hover";
export type WordmarkState = "from" | "to";
export type ParticleVisualState = "idle" | ParticlePhase;

export type ParticleTimings = {
  dissolveEndMs: number;
  funnelEndMs: number;
  settleEndMs: number;
  completeMs: number;
};

export type ParticleTargetBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type Metrics = {
  posY: number;
  posIFinal: number;
  shift: number;
};

export type AnimationRefs = {
  rootRef: React.RefObject<HTMLSpanElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  yRef: React.RefObject<HTMLSpanElement | null>;
  taglineRef: React.RefObject<HTMLSpanElement | null>;
};

export type BrandMarkProps = {
  className?: string;
  trigger?: Trigger;
  animate?: boolean;
  delayMs?: number;
  durationMs?: number;
  reserveWidth?: "max" | "final";
  ariaLabel?: string;
  tagline?: string;
  showTagline?: boolean;
};
