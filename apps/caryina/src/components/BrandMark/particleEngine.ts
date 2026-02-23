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
  neckMin: number;
  neckMax: number;
}): number {
  const { phase, x, y, vx, dtSec, options, neckMin, neckMax } = params;
  if (phase !== "funneling" && phase !== "settling") {
    return vx;
  }

  const corridorTop = options.baselineY - 42;
  const corridorBottom = options.baselineY + 28;
  const corridorRange = Math.max(1, corridorBottom - corridorTop);
  const corridorInfluence = clamp((corridorBottom - y) / corridorRange, 0, 1);
  const phaseMultiplier = phase === "funneling" ? 1 : 0.45;
  const neckInfluence = (0.35 + corridorInfluence * 0.9) * phaseMultiplier;

  if (x < neckMin) {
    return vx + (neckMin - x) * options.funnelStrength * neckInfluence * dtSec;
  }
  if (x > neckMax) {
    return vx - (x - neckMax) * options.funnelStrength * neckInfluence * dtSec;
  }

  return (
    vx +
    (options.neckX - x) * options.funnelStrength * neckInfluence * dtSec
  );
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
    vy *= 0.2;
  }

  return { x, y, vx, vy };
}

function computeReleaseDelayMs(params: {
  sourceY: number;
  baselineY: number;
  dissolveEndMs: number;
  random: () => number;
}): number {
  const { sourceY, baselineY, dissolveEndMs, random } = params;
  const verticalSpan = 62;
  const normalized = clamp(
    (sourceY - (baselineY - verticalSpan)) / Math.max(1, verticalSpan),
    0,
    1,
  );
  const directional = normalized * dissolveEndMs * 0.75;
  const jitter = random() * dissolveEndMs * 0.25;
  return directional + jitter;
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

export function createParticleEngine(options: ParticleEngineOptions): ParticleEngine {
  const fallbackPoint: ParticlePoint[] = [{ x: 0, y: 0 }];

  let resolvedOptions: Required<ParticleEngineOptions> = {
    particleCount: Math.max(0, Math.floor(options.particleCount)),
    sourcePoints: normalizePoints(options.sourcePoints, fallbackPoint),
    targetPoints: normalizePoints(options.targetPoints, options.sourcePoints.length > 0
      ? options.sourcePoints
      : fallbackPoint),
    seed: options.seed ?? DEFAULTS.seed,
    sourceJitterPx: options.sourceJitterPx ?? DEFAULTS.sourceJitterPx,
    gravity: options.gravity ?? DEFAULTS.gravity,
    damping: clamp(options.damping ?? DEFAULTS.damping, 0, 1),
    attractorStrength: options.attractorStrength ?? DEFAULTS.attractorStrength,
    funnelStrength: options.funnelStrength ?? DEFAULTS.funnelStrength,
    baselineY: options.baselineY ?? DEFAULTS.baselineY,
    neckX: options.neckX ?? DEFAULTS.neckX,
    neckHalfWidth: options.neckHalfWidth ?? DEFAULTS.neckHalfWidth,
    dissolveEndMs: options.dissolveEndMs ?? DEFAULTS.dissolveEndMs,
    funnelEndMs: options.funnelEndMs ?? DEFAULTS.funnelEndMs,
    settleEndMs: options.settleEndMs ?? DEFAULTS.settleEndMs,
    completeMs: options.completeMs ?? DEFAULTS.completeMs,
    viewportWidth: options.viewportWidth ?? DEFAULTS.viewportWidth,
    viewportHeight: options.viewportHeight ?? DEFAULTS.viewportHeight,
  };

  let state = createState(resolvedOptions.particleCount);
  let random = xorshift32(resolvedOptions.seed + resolvedOptions.particleCount);

  const initializeParticles = () => {
    const source = normalizePoints(resolvedOptions.sourcePoints, fallbackPoint);
    const target = normalizePoints(resolvedOptions.targetPoints, source);

    state.phase = "dissolving";
    state.elapsedMs = 0;
    state.settledCount = 0;

    const count = state.particleCount;
    if (count === 0) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const sourcePoint = source[index % source.length];
      const targetPoint = target[index % target.length];
      const jitter = resolvedOptions.sourceJitterPx;

      state.x[index] = sourcePoint.x + (random() - 0.5) * jitter;
      state.y[index] = sourcePoint.y + (random() - 0.5) * jitter;
      // Start with gentle downward drift so particles read as falling sand.
      state.vx[index] = (random() - 0.5) * 8;
      state.vy[index] = 12 + random() * 10;
      state.tx[index] = targetPoint.x;
      state.ty[index] = targetPoint.y;
      state.releaseMs[index] = computeReleaseDelayMs({
        sourceY: sourcePoint.y,
        baselineY: resolvedOptions.baselineY,
        dissolveEndMs: resolvedOptions.dissolveEndMs,
        random,
      });
      state.active[index] = 0;
      state.settled[index] = 0;
    }
  };

  const reset = (next?: Partial<ParticleEngineOptions>) => {
    resolvedOptions = mergeOptions(resolvedOptions, next);
    random = xorshift32(resolvedOptions.seed + resolvedOptions.particleCount);

    if (state.particleCount !== resolvedOptions.particleCount) {
      state = createState(resolvedOptions.particleCount);
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
      for (let index = 0; index < count; index += 1) {
        state.x[index] = state.tx[index];
        state.y[index] = state.ty[index];
        state.vx[index] = 0;
        state.vy[index] = 0;
        state.active[index] = 1;
        state.settled[index] = 1;
      }
      state.settledCount = count;
      return state;
    }

    let settledCount = 0;

    const dampingFrame = Math.pow(resolvedOptions.damping, dtSec * 60);
    const neckMin = resolvedOptions.neckX - resolvedOptions.neckHalfWidth;
    const neckMax = resolvedOptions.neckX + resolvedOptions.neckHalfWidth;
    const bounds = resolveParticleBounds(resolvedOptions);

    for (let index = 0; index < count; index += 1) {
      if (!shouldActivateParticle(state, index)) {
        continue;
      }

      let vx = state.vx[index];
      let vy = state.vy[index];
      let x = state.x[index];
      let y = state.y[index];

      vy += resolvedOptions.gravity * dtSec;

      vx = applyFunnelVelocity({
        phase: state.phase,
        x,
        y,
        vx,
        dtSec,
        options: resolvedOptions,
        neckMin,
        neckMax,
      });

      if (state.phase === "settling") {
        const tx = state.tx[index];
        const ty = state.ty[index];
        vx += (tx - x) * resolvedOptions.attractorStrength * dtSec;
        vy += (ty - y) * resolvedOptions.attractorStrength * dtSec;
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
        const settledNow = dx * dx + dy * dy <= 2.25;
        state.settled[index] = settledNow ? 1 : 0;
      }

      settledCount += state.settled[index];
    }

    state.settledCount = settledCount;
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
