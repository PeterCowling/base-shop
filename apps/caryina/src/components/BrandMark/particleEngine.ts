import {
  advanceActiveParticles,
  snapParticlesToTargets,
} from "./particleEngineMotion";
import {
  createState,
  initializeParticleState,
  mergeOptions,
  resolvePhase,
  resolveRequiredOptions,
  xorshift32,
} from "./particleEngineSetup";
import type {
  ParticleEngine,
  ParticleEngineOptions,
  ParticleEngineState,
  ParticlePoint,
} from "./particleEngineTypes";

export type {
  ParticleEngine,
  ParticleEngineOptions,
  ParticleEngineState,
  ParticlePhase,
  ParticlePoint,
} from "./particleEngineTypes";

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
