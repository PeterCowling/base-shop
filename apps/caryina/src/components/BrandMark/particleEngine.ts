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

const DEFAULTS = {
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function hashUnit(index: number): number {
  const value = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function xorshift32(seed: number): () => number {
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

function resolvePhase(
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

function mergeOptions(
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

function createState(particleCount: number): ParticleEngineState {
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

type ParticleBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function resolveParticleBounds(
  options: Required<ParticleEngineOptions>,
): ParticleBounds {
  return {
    left: -10,
    right: Number.isFinite(options.viewportWidth)
      ? options.viewportWidth + 10
      : Number.POSITIVE_INFINITY,
    top: -10,
    bottom: Number.isFinite(options.viewportHeight)
      ? options.viewportHeight + 10
      : Number.POSITIVE_INFINITY,
  };
}

function applyFunnelVelocity(params: {
  phase: ParticlePhase;
  x: number;
  y: number;
  vx: number;
  dtSec: number;
  options: Required<ParticleEngineOptions>;
  targetX: number;
  targetY: number;
}): number {
  const {
    phase,
    x,
    y,
    vx,
    dtSec,
    options,
    targetX,
    targetY,
  } = params;
  if (phase !== "funneling" && phase !== "settling") {
    return vx;
  }

  if (phase === "funneling") {
    const neckPullStrength = options.funnelStrength * 1.18;
    return vx + (options.neckX - x) * neckPullStrength * dtSec;
  }

  const descentSpan = Math.max(20, targetY - options.baselineY);
  const descentProgress = clamp((y - options.baselineY) / descentSpan, 0, 1);
  const phaseMultiplier = 0.55;
  const laneBlend = Math.pow(1 - descentProgress, 1.7);
  const targetBlend = 1 - laneBlend;
  const laneCenterX =
    options.neckMode === "split"
      ? targetX < options.neckX
        ? options.neckX -
          options.neckHalfWidth *
            options.splitLaneOffsetFactor *
            0.68
        : options.neckX +
          options.neckHalfWidth *
            options.splitLaneOffsetFactor *
            0.68
      : options.neckX;
  const desiredX = laneCenterX * laneBlend + targetX * targetBlend;
  const pullStrength =
    options.funnelStrength * (0.58 + descentProgress * 1.12) * phaseMultiplier;

  return vx + (desiredX - x) * pullStrength * dtSec;
}

function clampParticlePosition(params: {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bounds: ParticleBounds;
}): { x: number; y: number; vx: number; vy: number } {
  let { x, y, vx, vy } = params;
  const { bounds } = params;

  if (x < bounds.left) {
    x = bounds.left;
    vx *= 0.35;
  } else if (x > bounds.right) {
    x = bounds.right;
    vx *= 0.35;
  }

  if (y < bounds.top) {
    y = bounds.top;
    vy = Math.abs(vy) * 0.35;
  } else if (y > bounds.bottom) {
    y = bounds.bottom;
    vy = -Math.abs(vy) * 0.25;
  }

  return { x, y, vx, vy };
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

function shouldActivateParticle(state: ParticleEngineState, index: number): boolean {
  if (state.active[index] === 1) {
    return true;
  }
  if (state.elapsedMs < state.releaseMs[index]) {
    return false;
  }
  state.active[index] = 1;
  return true;
}

function resolveRequiredOptions(
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

function initializeParticleState(params: {
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

function snapParticlesToTargets(state: ParticleEngineState): void {
  const count = state.particleCount;
  for (let index = 0; index < count; index += 1) {
    state.x[index] = state.tx[index];
    state.y[index] = state.ty[index];
    state.vx[index] = 0;
    state.vy[index] = 0;
    state.active[index] = 1;
    state.settled[index] = 1;
  }
  state.settledCount = count;
}

function advanceActiveParticles(params: {
  state: ParticleEngineState;
  options: Required<ParticleEngineOptions>;
  dtSec: number;
  targetMinY: number;
  targetMaxY: number;
  sourceStartY: Float32Array;
}): number {
  const { state, options, dtSec, targetMinY, targetMaxY, sourceStartY } = params;
  const dampingFrame = Math.pow(options.damping, dtSec * 60);
  const bounds = resolveParticleBounds(options);
  const targetSpan = Math.max(1, targetMaxY - targetMinY);
  let settledCount = 0;
  const count = state.particleCount;

  for (let index = 0; index < count; index += 1) {
    if (!shouldActivateParticle(state, index)) {
      continue;
    }

    let vx = state.vx[index];
    let vy = state.vy[index];
    let x = state.x[index];
    let y = state.y[index];

    vy += options.gravity * dtSec;

    vx = applyFunnelVelocity({
      phase: state.phase,
      x,
      y,
      vx,
      dtSec,
      options,
      targetX: state.tx[index],
      targetY: state.ty[index],
    });

    const tx = state.tx[index];
    const ty = state.ty[index];
    const targetRatio = clamp((ty - targetMinY) / targetSpan, 0, 1);
    const guideDepthRatio = 0.06 + targetRatio * 0.42;
    const guideNoisePx = (hashUnit(index) - 0.5) * 3.2;
    const tyGuide = targetMinY + targetSpan * guideDepthRatio + guideNoisePx;
    const laneCenterX =
      options.neckMode === "split"
        ? tx < options.neckX
          ? options.neckX - options.neckHalfWidth * options.splitLaneOffsetFactor
          : options.neckX + options.neckHalfWidth * options.splitLaneOffsetFactor
        : options.neckX;

    if (state.phase === "funneling") {
      const releaseMs = state.releaseMs[index];
      const funnelSpanMs = Math.max(120, options.funnelEndMs - releaseMs);
      const funnelProgress = clamp((state.elapsedMs - releaseMs) / funnelSpanMs, 0, 1);
      const eased = 1 - (1 - funnelProgress) * (1 - funnelProgress);
      const laneNoise = (hashUnit(index * 17 + 3) - 0.5) * 0.8;
      const pathX = options.neckX + laneNoise;
      const pathY = lerp(sourceStartY[index], tyGuide, eased);

      vx += (pathX - x) * options.funnelStrength * options.attractorStrength * 0.62 * dtSec;
      vy += (pathY - y) * options.funnelStrength * options.attractorStrength * 0.78 * dtSec;
    }

    if (state.phase === "settling") {
      const settleSpanMs = Math.max(160, options.settleEndMs - options.funnelEndMs);
      const settleProgress = clamp(
        (state.elapsedMs - options.funnelEndMs) / settleSpanMs,
        0,
        1,
      );
      const eased = 1 - (1 - settleProgress) * (1 - settleProgress);
      const lateralEase = Math.pow(settleProgress, 1.38);
      const pathY = lerp(tyGuide, ty, eased);
      const pathX = lerp(options.neckX, tx, lateralEase);

      vx += (pathX - x) * options.attractorStrength * 0.92 * dtSec;
      vy += (pathY - y) * options.attractorStrength * 1.06 * dtSec;
    }

    vx *= dampingFrame;
    vy *= dampingFrame;

    x += vx * dtSec;
    y += vy * dtSec;

    const bounded = clampParticlePosition({ x, y, vx, vy, bounds });
    x = bounded.x;
    y = bounded.y;
    vx = bounded.vx;
    vy = bounded.vy;

    state.vx[index] = vx;
    state.vy[index] = vy;
    state.x[index] = x;
    state.y[index] = y;

    if (state.phase === "settling") {
      const dx = state.tx[index] - x;
      const dy = state.ty[index] - y;
      state.settled[index] = dx * dx + dy * dy <= 2.25 ? 1 : 0;
    }

    settledCount += state.settled[index];
  }

  return settledCount;
}

export function createParticleEngine(options: ParticleEngineOptions): ParticleEngine {
  const fallbackPoint: ParticlePoint[] = [{ x: 0, y: 0 }];

  let resolvedOptions: Required<ParticleEngineOptions> = resolveRequiredOptions(
    options,
    fallbackPoint,
  );

  let state = createState(resolvedOptions.particleCount);
  let random = xorshift32(resolvedOptions.seed + resolvedOptions.particleCount);
  let targetMinY = 0;
  let targetMaxY = 1;
  let sourceStartY = new Float32Array(resolvedOptions.particleCount);

  const initializeParticles = () => {
    const ranges = initializeParticleState({
      state,
      options: resolvedOptions,
      fallbackPoint,
      random,
      sourceStartY,
    });
    targetMinY = ranges.targetMinY;
    targetMaxY = ranges.targetMaxY;
  };

  const reset = (next?: Partial<ParticleEngineOptions>) => {
    resolvedOptions = mergeOptions(resolvedOptions, next);
    random = xorshift32(resolvedOptions.seed + resolvedOptions.particleCount);

    if (state.particleCount !== resolvedOptions.particleCount) {
      state = createState(resolvedOptions.particleCount);
      sourceStartY = new Float32Array(resolvedOptions.particleCount);
    }

    initializeParticles();
  };

  const tick = (deltaMs: number): ParticleEngineState => {
    if (state.phase === "done") {
      return state;
    }

    if (!Number.isFinite(deltaMs) || deltaMs <= 0) {
      return state;
    }

    const clampedDelta = Math.min(deltaMs, 64);
    const dtSec = clampedDelta / 1000;

    state.elapsedMs += clampedDelta;
    state.phase = resolvePhase(state.elapsedMs, resolvedOptions);

    const count = state.particleCount;
    if (count === 0) {
      if (state.phase === "done") {
        state.settledCount = 0;
      }
      return state;
    }

    if (state.phase === "done") {
      snapParticlesToTargets(state);
      return state;
    }

    state.settledCount = advanceActiveParticles({
      state,
      options: resolvedOptions,
      dtSec,
      targetMinY,
      targetMaxY,
      sourceStartY,
    });
    return state;
  };

  initializeParticles();

  return {
    get state() {
      return state;
    },
    reset,
    tick,
  };
}
