import { clamp } from "@acme/lib/math/animation";

import {
  DEFAULTS,
  type ParticleEngineOptions,
  type ParticleEngineState,
  type ParticlePhase,
  type ParticlePoint,
} from "./particleEngineTypes";

export function xorshift32(seed: number): () => number {
  let x = seed | 0;
  if (x === 0) x = 1;

  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 1_000_000) / 1_000_000;
  };
}

function normalizePoints(
  points: ParticlePoint[] | undefined,
  fallback: ParticlePoint[]
): ParticlePoint[] {
  const safe = points?.filter((point) =>
    Number.isFinite(point.x) && Number.isFinite(point.y)
  );

  if (safe && safe.length > 0) {
    return safe;
  }

  return fallback;
}

export function resolvePhase(
  elapsedMs: number,
  options: Required<ParticleEngineOptions>
): ParticlePhase {
  if (elapsedMs >= options.completeMs) {
    return "done";
  }
  if (elapsedMs >= options.funnelEndMs) {
    return "settling";
  }
  if (elapsedMs >= options.dissolveEndMs) {
    return "funneling";
  }
  return "dissolving";
}

export function mergeOptions(
  base: Required<ParticleEngineOptions>,
  next?: Partial<ParticleEngineOptions>
): Required<ParticleEngineOptions> {
  if (!next) {
    return base;
  }

  return {
    ...base,
    ...next,
    particleCount: Math.max(0, Math.floor(next.particleCount ?? base.particleCount)),
    sourcePoints: next.sourcePoints ?? base.sourcePoints,
    targetPoints: next.targetPoints ?? base.targetPoints,
  };
}

export function createState(particleCount: number): ParticleEngineState {
  return {
    phase: "dissolving",
    elapsedMs: 0,
    particleCount,
    settledCount: 0,
    x: new Float32Array(particleCount),
    y: new Float32Array(particleCount),
    vx: new Float32Array(particleCount),
    vy: new Float32Array(particleCount),
    tx: new Float32Array(particleCount),
    ty: new Float32Array(particleCount),
    releaseMs: new Float32Array(particleCount),
    active: new Uint8Array(particleCount),
    settled: new Uint8Array(particleCount),
  };
}

function resolveTargetYRange(points: ParticlePoint[]): { minY: number; maxY: number } {
  if (points.length === 0) {
    return { minY: 0, maxY: 1 };
  }

  let minY = points[0].y;
  let maxY = points[0].y;
  for (let index = 1; index < points.length; index += 1) {
    const pointY = points[index].y;
    if (pointY < minY) minY = pointY;
    if (pointY > maxY) maxY = pointY;
  }

  return { minY, maxY };
}

function resolveTargetXRange(points: ParticlePoint[]): { minX: number; maxX: number } {
  if (points.length === 0) {
    return { minX: 0, maxX: 1 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  for (let index = 1; index < points.length; index += 1) {
    const pointX = points[index].x;
    if (pointX < minX) minX = pointX;
    if (pointX > maxX) maxX = pointX;
  }

  return { minX, maxX };
}

function computeReleaseDelayMs(params: {
  targetX: number;
  targetY: number;
  targetMinY: number;
  targetMaxY: number;
  targetMinX: number;
  targetMaxX: number;
  neckX: number;
  dissolveEndMs: number;
  funnelEndMs: number;
  settleEndMs: number;
  random: () => number;
}): number {
  const {
    targetX,
    targetY,
    targetMinY,
    targetMaxY,
    targetMinX,
    targetMaxX,
    neckX,
    dissolveEndMs,
    funnelEndMs,
    settleEndMs,
    random,
  } = params;
  const span = Math.max(1, targetMaxY - targetMinY);
  const normalized = clamp((targetY - targetMinY) / span, 0, 1);
  const maxHorizontal = Math.max(neckX - targetMinX, targetMaxX - neckX, 1);
  const horizontalNormalized = clamp(Math.abs(targetX - neckX) / maxHorizontal, 0, 1);
  const stagedBase = dissolveEndMs * 0.08;
  const stagedLimit = Math.max(stagedBase + 160, funnelEndMs * 0.94);
  const releaseWindow = Math.max(200, stagedLimit - stagedBase);
  const directional = normalized * releaseWindow;
  const radialSpread = horizontalNormalized * releaseWindow * 0.34;
  const jitter = random() * Math.max(8, settleEndMs * 0.016);
  return stagedBase + directional + radialSpread + jitter;
}

export function resolveRequiredOptions(
  options: ParticleEngineOptions,
  fallbackPoint: ParticlePoint[],
): Required<ParticleEngineOptions> {
  return {
    particleCount: Math.max(0, Math.floor(options.particleCount)),
    sourcePoints: normalizePoints(options.sourcePoints, fallbackPoint),
    targetPoints: normalizePoints(
      options.targetPoints,
      options.sourcePoints.length > 0 ? options.sourcePoints : fallbackPoint,
    ),
    seed: options.seed ?? DEFAULTS.seed,
    sourceJitterPx: options.sourceJitterPx ?? DEFAULTS.sourceJitterPx,
    gravity: options.gravity ?? DEFAULTS.gravity,
    damping: clamp(options.damping ?? DEFAULTS.damping, 0, 1),
    attractorStrength: options.attractorStrength ?? DEFAULTS.attractorStrength,
    funnelStrength: options.funnelStrength ?? DEFAULTS.funnelStrength,
    baselineY: options.baselineY ?? DEFAULTS.baselineY,
    neckX: options.neckX ?? DEFAULTS.neckX,
    neckHalfWidth: options.neckHalfWidth ?? DEFAULTS.neckHalfWidth,
    neckMode: options.neckMode ?? DEFAULTS.neckMode,
    splitLaneOffsetFactor:
      options.splitLaneOffsetFactor ?? DEFAULTS.splitLaneOffsetFactor,
    dissolveEndMs: options.dissolveEndMs ?? DEFAULTS.dissolveEndMs,
    funnelEndMs: options.funnelEndMs ?? DEFAULTS.funnelEndMs,
    settleEndMs: options.settleEndMs ?? DEFAULTS.settleEndMs,
    completeMs: options.completeMs ?? DEFAULTS.completeMs,
    viewportWidth: options.viewportWidth ?? DEFAULTS.viewportWidth,
    viewportHeight: options.viewportHeight ?? DEFAULTS.viewportHeight,
  };
}

export function initializeParticleState(params: {
  state: ParticleEngineState;
  options: Required<ParticleEngineOptions>;
  fallbackPoint: ParticlePoint[];
  random: () => number;
  sourceStartY: Float32Array;
}): { targetMinY: number; targetMaxY: number } {
  const { state, options, fallbackPoint, random, sourceStartY } = params;
  const source = normalizePoints(options.sourcePoints, fallbackPoint);
  const target = normalizePoints(options.targetPoints, source);
  const targetYRange = resolveTargetYRange(target);
  const targetXRange = resolveTargetXRange(target);

  state.phase = "dissolving";
  state.elapsedMs = 0;
  state.settledCount = 0;

  const count = state.particleCount;
  for (let index = 0; index < count; index += 1) {
    const sourcePoint = source[index % source.length];
    const targetPoint = target[index % target.length];
    const jitter = options.sourceJitterPx;

    state.x[index] = sourcePoint.x + (random() - 0.5) * jitter;
    state.y[index] = sourcePoint.y + (random() - 0.5) * jitter;
    sourceStartY[index] = state.y[index];
    // Start with gentle downward drift so particles read as falling sand.
    state.vx[index] = (random() - 0.5) * 8;
    state.vy[index] = 6 + random() * 6;
    state.tx[index] = targetPoint.x;
    state.ty[index] = targetPoint.y;
    state.releaseMs[index] = computeReleaseDelayMs({
      targetX: targetPoint.x,
      targetY: targetPoint.y,
      targetMinY: targetYRange.minY,
      targetMaxY: targetYRange.maxY,
      targetMinX: targetXRange.minX,
      targetMaxX: targetXRange.maxX,
      neckX: options.neckX,
      dissolveEndMs: options.dissolveEndMs,
      funnelEndMs: options.funnelEndMs,
      settleEndMs: options.settleEndMs,
      random,
    });
    state.active[index] = 0;
    state.settled[index] = 0;
  }

  return { targetMinY: targetYRange.minY, targetMaxY: targetYRange.maxY };
}
