"use client";

import { clamp } from "@acme/lib/math/animation";

import type { ParticleTargetBounds, ParticleTimings, Trigger } from "./brandMarkTypes";
import type { ParticleEngineState, ParticlePoint } from "./particleEngine";
import { sampleTextPixels } from "./sampleTextPixels";

export const PARTICLE_SAMPLING_TIMEOUT_MS = 500;
export const HOVER_REPLAY_COOLDOWN_MS = 1200;
export const PARTICLE_SAMPLE_SEED = 20260223;

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

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function easeOutCubic(value: number): number {
  const normalized = clamp(value, 0, 1);
  return 1 - (1 - normalized) ** 3;
}

export function hashUnit(value: number): number {
  const raw = Math.sin(value * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

export function mixRgb(
  from: [number, number, number],
  to: [number, number, number],
  amount: number
): [number, number, number] {
  return [
    Math.round(lerp(from[0], to[0], amount)),
    Math.round(lerp(from[1], to[1], amount)),
    Math.round(lerp(from[2], to[2], amount)),
  ];
}

function parseRgbColor(input: string): [number, number, number] | null {
  const match = input.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;

  const red = Number(match[1]);
  const green = Number(match[2]);
  const blue = Number(match[3]);
  if (!Number.isFinite(red) || !Number.isFinite(green) || !Number.isFinite(blue)) {
    return null;
  }

  return [red, green, blue];
}

export function resolveCssColorToRgb(color: string, fallback: [number, number, number]): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.left = "-10000px";
  probe.style.color = color;
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();
  return parseRgbColor(resolved) ?? fallback;
}

export function waitForFontsReady(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts?.ready) {
      resolve(false);
      return;
    }

    let done = false;
    const timer = window.setTimeout(() => {
      if (done) return;
      done = true;
      resolve(false);
    }, timeoutMs);

    fonts.ready
      .then(() => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve(true);
      })
      .catch(() => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        resolve(false);
      });
  });
}

export function waitForWidthStability(element: HTMLElement, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    let lastWidth = -1;
    let stableFrames = 0;

    const poll = () => {
      if (performance.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }

      const width = element.getBoundingClientRect().width;
      if (width > 0 && Math.abs(width - lastWidth) < 0.25) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
      }
      lastWidth = width;

      if (stableFrames >= 2) {
        resolve(true);
        return;
      }

      requestAnimationFrame(poll);
    };

    requestAnimationFrame(poll);
  });
}

function buildFontString(style: CSSStyleDeclaration): string {
  const fontWeight = style.fontWeight || "400";
  const fontSize = style.fontSize || "16px";
  const fontFamily = style.fontFamily || "var(--font-dm-sans)";
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

export function buildParticleTimings(mode: Trigger): ParticleTimings {
  if (mode === "hover") {
    return {
      dissolveEndMs: 180,
      funnelEndMs: 950,
      settleEndMs: 1800,
      completeMs: 2100,
    };
  }

  return {
    dissolveEndMs: 280,
    funnelEndMs: 1700,
    settleEndMs: 3200,
    completeMs: 3600,
  };
}

export function downsamplePairedPoints(params: {
  sourcePoints: ParticlePoint[];
  targetPoints: ParticlePoint[];
  count: number;
  seed: number;
}): { sourcePoints: ParticlePoint[]; targetPoints: ParticlePoint[] } {
  const { sourcePoints, targetPoints, count, seed } = params;
  const upperBound = Math.min(sourcePoints.length, targetPoints.length);
  const cappedCount = Math.max(0, Math.min(Math.floor(count), upperBound));

  if (cappedCount === 0) {
    return { sourcePoints: [], targetPoints: [] };
  }

  if (upperBound <= cappedCount) {
    return {
      sourcePoints: sourcePoints.slice(0, upperBound),
      targetPoints: targetPoints.slice(0, upperBound),
    };
  }

  const random = xorshift32(seed);
  const stride = upperBound / cappedCount;
  const sampledSource: ParticlePoint[] = new Array(cappedCount);
  const sampledTarget: ParticlePoint[] = new Array(cappedCount);

  for (let index = 0; index < cappedCount; index += 1) {
    const start = Math.floor(index * stride);
    const end = Math.min(upperBound, Math.floor((index + 1) * stride));
    const span = Math.max(1, end - start);
    const chosen = start + Math.floor(random() * span);
    sampledSource[index] = sourcePoints[chosen];
    sampledTarget[index] = targetPoints[chosen];
  }

  return {
    sourcePoints: sampledSource,
    targetPoints: sampledTarget,
  };
}

export function resolveParticleTargetBounds(
  points: ParticlePoint[],
  fallback: ParticleTargetBounds
): ParticleTargetBounds {
  if (points.length === 0) {
    return fallback;
  }

  let left = points[0].x;
  let right = points[0].x;
  let top = points[0].y;
  let bottom = points[0].y;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    if (point.x < left) left = point.x;
    if (point.x > right) right = point.x;
    if (point.y < top) top = point.y;
    if (point.y > bottom) bottom = point.y;
  }

  return { left, right, top, bottom };
}

export function computeTaglineRevealFromParticles(params: {
  state: ParticleEngineState;
  settleStartMs: number;
  settleEndMs: number;
}): number {
  const { state, settleStartMs, settleEndMs } = params;
  if (state.phase === "done") {
    return 1;
  }
  if (state.phase !== "settling") {
    return 0;
  }

  const settleSpanMs = Math.max(1, settleEndMs - settleStartMs);
  const settleProgress = clamp((state.elapsedMs - settleStartMs) / settleSpanMs, 0, 1);
  const normalized = clamp((settleProgress - 0.04) / 0.92, 0, 1);
  const smooth = normalized * normalized * (3 - 2 * normalized);
  return smooth ** 1.3;
}

export function applyTaglineRevealStyle(root: HTMLSpanElement, revealProgress: number): void {
  const clamped = clamp(revealProgress, 0, 1);
  const revealPercent = clamped * 100;
  const maskEnd = clamp(revealPercent + 2, 0, 100);
  const featherStart = clamp(maskEnd - 12, 0, 100);
  const solidEnd = clamp(featherStart - 7, 0, 100);
  const opacity = 0.12 + easeOutCubic(clamped) * 0.88;
  const blur = (1 - clamped) * 0.78;

  root.style.setProperty("--tagline-reveal", clamped.toFixed(3));
  root.style.setProperty("--tagline-mask-solid-end", `${solidEnd.toFixed(2)}%`);
  root.style.setProperty("--tagline-mask-feather-start", `${featherStart.toFixed(2)}%`);
  root.style.setProperty("--tagline-mask-end", `${maskEnd.toFixed(2)}%`);
  root.style.setProperty("--tagline-opacity", opacity.toFixed(3));
  root.style.setProperty("--tagline-blur", `${blur.toFixed(2)}px`);
}

export function buildParticlePoints(
  tagline: string,
  rootRect: DOMRect,
  yRect: DOMRect,
  taglineRect: DOMRect,
  taglineElement: HTMLSpanElement
): {
  sourcePoints: ParticlePoint[];
  targetPoints: ParticlePoint[];
  targetBounds: ParticleTargetBounds;
} {
  const taglineStyle = window.getComputedStyle(taglineElement);
  const fontSizePx = Number.parseFloat(taglineStyle.fontSize) || 16;
  const parsedLineHeight = Number.parseFloat(taglineStyle.lineHeight);
  const lineHeightPx =
    Number.isFinite(parsedLineHeight) && parsedLineHeight > 0
      ? parsedLineHeight
      : fontSizePx * 1.4;
  const parsedLetterSpacing = Number.parseFloat(taglineStyle.letterSpacing);
  const letterSpacingPx = Number.isFinite(parsedLetterSpacing) ? parsedLetterSpacing : 0;

  const targetSample = sampleTextPixels({
    text: tagline,
    font: buildFontString(taglineStyle),
    sampleStep: 1,
    padding: 0,
    alphaThreshold: 100,
    maxWidthPx: taglineRect.width,
    lineHeightPx,
    letterSpacingPx,
  });

  const targetOffsetX = taglineRect.left - rootRect.left;
  const targetOffsetY = taglineRect.top - rootRect.top;

  const rawTargetPoints =
    targetSample.points.length > 0
      ? targetSample.points
          .map((point) => ({
            x: targetOffsetX + point.x,
            y: targetOffsetY + point.y,
          }))
          .sort((a, b) => a.x - b.x || a.y - b.y)
      : [
          {
            x: targetOffsetX + taglineRect.width * 0.5,
            y: targetOffsetY + taglineRect.height * 0.5,
          },
        ];

  // Sort by vertical position first so particles settle into the tagline top-to-bottom.
  const targetPoints = [...rawTargetPoints].sort((a, b) => a.y - b.y || a.x - b.x);

  // Emit all particles from the bottom tip of the disappearing `y`.
  const sourceOffsetX = yRect.left - rootRect.left;
  const sourceOffsetY = yRect.top - rootRect.top;
  const emitterX = sourceOffsetX + yRect.width * 0.55;
  const emitterY = sourceOffsetY + yRect.height * 0.96;
  const emitterHalfWidth = Math.max(1, yRect.width * 0.1);
  const emitterRows = 3;
  const emitterCols = 9;
  const emitterSpan = emitterHalfWidth * 2;

  const sourcePoints = targetPoints.map((_, index) => {
    const col = index % emitterCols;
    const row = Math.floor(index / emitterCols) % emitterRows;
    const x =
      emitterX - emitterHalfWidth + (col / Math.max(1, emitterCols - 1)) * emitterSpan;
    const y = emitterY + row * 0.35;
    return { x, y };
  });

  const targetBounds = resolveParticleTargetBounds(targetPoints, {
    left: targetOffsetX,
    right: targetOffsetX + Math.max(1, taglineRect.width),
    top: targetOffsetY,
    bottom: targetOffsetY + Math.max(1, taglineRect.height),
  });

  return { sourcePoints, targetPoints, targetBounds };
}
