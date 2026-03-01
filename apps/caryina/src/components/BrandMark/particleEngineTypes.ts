export type ParticlePoint = {
  x: number;
  y: number;
};

export type ParticlePhase =
  | "dissolving"
  | "funneling"
  | "settling"
  | "done";

export type ParticleEngineOptions = {
  particleCount: number;
  sourcePoints: ParticlePoint[];
  targetPoints: ParticlePoint[];
  seed?: number;
  sourceJitterPx?: number;
  gravity?: number;
  damping?: number;
  attractorStrength?: number;
  funnelStrength?: number;
  baselineY?: number;
  neckX?: number;
  neckHalfWidth?: number;
  neckMode?: "single" | "split";
  splitLaneOffsetFactor?: number;
  dissolveEndMs?: number;
  funnelEndMs?: number;
  settleEndMs?: number;
  completeMs?: number;
  viewportWidth?: number;
  viewportHeight?: number;
};

export type ParticleEngineState = {
  phase: ParticlePhase;
  elapsedMs: number;
  particleCount: number;
  settledCount: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  tx: Float32Array;
  ty: Float32Array;
  releaseMs: Float32Array;
  active: Uint8Array;
  settled: Uint8Array;
};

export type ParticleEngine = {
  state: ParticleEngineState;
  reset(next?: Partial<ParticleEngineOptions>): void;
  tick(deltaMs: number): ParticleEngineState;
};

export type ParticleBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const DEFAULTS = {
  seed: 20260223,
  sourceJitterPx: 2,
  gravity: 165,
  damping: 0.975,
  attractorStrength: 9.8,
  funnelStrength: 1.05,
  baselineY: 0,
  neckX: 0,
  neckHalfWidth: 12,
  neckMode: "single" as const,
  splitLaneOffsetFactor: 0.78,
  dissolveEndMs: 800,
  funnelEndMs: 2200,
  settleEndMs: 3500,
  completeMs: 4000,
  viewportWidth: Number.POSITIVE_INFINITY,
  viewportHeight: Number.POSITIVE_INFINITY,
} as const;
