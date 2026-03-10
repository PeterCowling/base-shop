import { clamp } from "@acme/lib/math/animation";

import type {
  ParticleBounds,
  ParticleEngineOptions,
  ParticleEngineState,
  ParticlePhase,
} from "./particleEngineTypes";

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function hashUnit(index: number): number {
  const value = Math.sin((index + 1) * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

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

export function snapParticlesToTargets(state: ParticleEngineState): void {
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

export function advanceActiveParticles(params: {
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
