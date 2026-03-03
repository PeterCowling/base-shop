"use client";

import type React from "react";

import { clamp } from "@acme/lib/math/animation";

import type { AnimationRefs, ParticleVisualState, Trigger } from "./brandMarkTypes";
import {
  applyTaglineRevealStyle,
  buildParticlePoints,
  buildParticleTimings,
  computeTaglineRevealFromParticles,
  downsamplePairedPoints,
  hashUnit,
  lerp,
  mixRgb,
  PARTICLE_SAMPLE_SEED,
  PARTICLE_SAMPLING_TIMEOUT_MS,
  resolveCssColorToRgb,
  waitForFontsReady,
  waitForWidthStability,
} from "./brandMarkUtils";
import { createParticleEngine } from "./particleEngine";

export async function runParticleAnimation(params: {
  mode: Trigger;
  tagline: string;
  refs: AnimationRefs;
  runIdRef: React.MutableRefObject<number>;
  rafRef: React.MutableRefObject<number | null>;
  setCanvasActive: React.Dispatch<React.SetStateAction<boolean>>;
  setParticleVisualState: (next: ParticleVisualState) => void;
  stopParticleLoop: (nextState: ParticleVisualState) => void;
}): Promise<void> {
  const {
    mode,
    tagline,
    refs,
    runIdRef,
    rafRef,
    setCanvasActive,
    setParticleVisualState,
    stopParticleLoop,
  } = params;

  const root = refs.rootRef.current;
  const canvas = refs.canvasRef.current;
  const yElement = refs.yRef.current;
  const taglineElement = refs.taglineRef.current;

  if (!root || !canvas || !yElement || !taglineElement) {
    stopParticleLoop("done");
    return;
  }

  const [isFontReady, isWidthStable] = await Promise.all([
    waitForFontsReady(PARTICLE_SAMPLING_TIMEOUT_MS),
    waitForWidthStability(root, PARTICLE_SAMPLING_TIMEOUT_MS),
  ]);

  if (!isFontReady && !isWidthStable) {
    stopParticleLoop("done");
    return;
  }

  const runId = runIdRef.current + 1;
  runIdRef.current = runId;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    stopParticleLoop("done");
    return;
  }

  const rootRect = root.getBoundingClientRect();
  const yRect = yElement.getBoundingClientRect();
  const taglineRect = taglineElement.getBoundingClientRect();

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssWidth = Math.max(1, rootRect.width);
  const cssHeight = Math.max(1, rootRect.height);
  const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));

  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, cssWidth, cssHeight);

  const { sourcePoints, targetPoints, targetBounds } = buildParticlePoints(
    tagline,
    rootRect,
    yRect,
    taglineRect,
    taglineElement
  );

  const area = cssWidth * cssHeight;
  const densityCap = clamp(Math.round(area / 22), 260, 900);
  const requiredForTagline = targetPoints.length;
  let particleCount = clamp(requiredForTagline, 180, densityCap);
  if (window.innerWidth < 360) {
    particleCount = clamp(requiredForTagline, 140, 520);
  } else if (window.innerWidth < 480) {
    particleCount = clamp(requiredForTagline, 170, 680);
  }
  particleCount = Math.min(particleCount, targetPoints.length);
  if (particleCount <= 0) {
    stopParticleLoop("done");
    return;
  }

  const sampled = downsamplePairedPoints({
    sourcePoints,
    targetPoints,
    count: particleCount,
    seed: PARTICLE_SAMPLE_SEED + runId,
  });
  particleCount = sampled.targetPoints.length;
  if (particleCount <= 0) {
    stopParticleLoop("done");
    return;
  }

  const timings = buildParticleTimings(mode);
  const neckX = yRect.left - rootRect.left + yRect.width * 0.5;
  const baselineY = yRect.top - rootRect.top + yRect.height;

  const engine = createParticleEngine({
    particleCount,
    sourcePoints: sampled.sourcePoints,
    targetPoints: sampled.targetPoints,
    sourceJitterPx: 0.85,
    gravity: 58,
    damping: 0.94,
    attractorStrength: 7.8,
    funnelStrength: 1.92,
    baselineY,
    neckX,
    neckHalfWidth: Math.max(14, yRect.width * 0.62),
    neckMode: "split",
    splitLaneOffsetFactor: 0.82,
    dissolveEndMs: timings.dissolveEndMs,
    funnelEndMs: timings.funnelEndMs,
    settleEndMs: timings.settleEndMs,
    completeMs: timings.completeMs,
    viewportWidth: cssWidth,
    viewportHeight: cssHeight,
  });

  const rootStyle = window.getComputedStyle(root);
  const primaryColor = resolveCssColorToRgb(rootStyle.color, [224, 142, 149]);
  const sandStartColor = mixRgb(primaryColor, [245, 210, 194], 0.44);
  const sandEndColor = mixRgb(primaryColor, [192, 151, 141], 0.36);

  let lastFrameAt = performance.now();
  let revealProgress = 0;
  applyTaglineRevealStyle(root, 0);
  setCanvasActive(true);
  setParticleVisualState("dissolving");

  const frame = (now: number) => {
    if (runId !== runIdRef.current) return;

    const deltaMs = now - lastFrameAt;
    lastFrameAt = now;

    const next = engine.tick(deltaMs);
    setParticleVisualState(next.phase);

    const reveal = computeTaglineRevealFromParticles({
      state: next,
      settleStartMs: timings.funnelEndMs,
      settleEndMs: timings.settleEndMs,
    });
    revealProgress = Math.max(revealProgress, reveal);
    applyTaglineRevealStyle(root, revealProgress);

    context.clearRect(0, 0, cssWidth, cssHeight);
    const blend = clamp(
      (next.elapsedMs - timings.dissolveEndMs) /
        Math.max(1, timings.settleEndMs - timings.dissolveEndMs),
      0,
      1
    );

    const sandBlend = clamp(blend * 0.74 + revealProgress * 0.26, 0, 1);
    const red = Math.round(lerp(sandStartColor[0], sandEndColor[0], sandBlend));
    const green = Math.round(lerp(sandStartColor[1], sandEndColor[1], sandBlend));
    const blue = Math.round(lerp(sandStartColor[2], sandEndColor[2], sandBlend));
    const particleAlpha =
      next.phase === "settling"
        ? lerp(0.19, 0.08, revealProgress)
        : lerp(0.56, 0.42, blend);
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${particleAlpha.toFixed(3)})`;
    const revealFrontY =
      targetBounds.top + (targetBounds.bottom - targetBounds.top) * revealProgress;

    for (let index = 0; index < next.particleCount; index += 1) {
      if (next.active[index] !== 1) continue;
      if (next.phase === "settling" && next.settled[index] === 1) continue;
      const x = next.x[index];
      const y = next.y[index];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      if (next.phase === "settling" && y <= revealFrontY - 1.5) continue;

      const grain = hashUnit((index + 1) * 1.618);
      const baseRadius = lerp(0.42, 0.96, grain);
      const phaseScale = next.phase === "settling" ? lerp(1, 0.78, revealProgress) : 1.02;

      context.beginPath();
      context.arc(x, y, baseRadius * phaseScale, 0, Math.PI * 2);
      context.fill();
    }

    if (next.phase === "done") {
      stopParticleLoop("done");
      return;
    }

    rafRef.current = requestAnimationFrame(frame);
  };

  rafRef.current = requestAnimationFrame(frame);
}
