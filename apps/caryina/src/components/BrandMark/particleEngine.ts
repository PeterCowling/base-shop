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
  gravity: 220,
  damping: 0.985,
  attractorStrength: 9.8,
  funnelStrength: 0.85,
  baselineY: 0,
  neckX: 0,
  neckHalfWidth: 12,
  dissolveEndMs: 800,
  funnelEndMs: 2200,
  settleEndMs: 3500,
  completeMs: 4000,
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
    settled: new Uint8Array(particleCount),
  };
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
      const sourcePoint = source[(index * 7) % source.length];
      const targetPoint = target[index % target.length];
      const jitter = resolvedOptions.sourceJitterPx;

      state.x[index] = sourcePoint.x + (random() - 0.5) * jitter;
      state.y[index] = sourcePoint.y + (random() - 0.5) * jitter;
      state.vx[index] = (random() - 0.5) * 18;
      state.vy[index] = -random() * 15;
      state.tx[index] = targetPoint.x;
      state.ty[index] = targetPoint.y;
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
        state.settled[index] = 1;
      }
      state.settledCount = count;
      return state;
    }

    let settledCount = 0;

    const dampingFrame = Math.pow(resolvedOptions.damping, dtSec * 60);
    const neckMin = resolvedOptions.neckX - resolvedOptions.neckHalfWidth;
    const neckMax = resolvedOptions.neckX + resolvedOptions.neckHalfWidth;

    for (let index = 0; index < count; index += 1) {
      let vx = state.vx[index];
      let vy = state.vy[index];
      let x = state.x[index];
      let y = state.y[index];

      vy += resolvedOptions.gravity * dtSec;

      if (state.phase === "funneling" || state.phase === "settling") {
        const baselineDistance = Math.abs(y - resolvedOptions.baselineY);
        const neckInfluence = clamp(1 - baselineDistance / 48, 0, 1);
        if (neckInfluence > 0) {
          if (x < neckMin) {
            vx +=
              (neckMin - x) * resolvedOptions.funnelStrength * neckInfluence * dtSec;
          } else if (x > neckMax) {
            vx -=
              (x - neckMax) * resolvedOptions.funnelStrength * neckInfluence * dtSec;
          }
        }
      }

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
