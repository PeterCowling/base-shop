"use client";

import React from "react";

import styles from "./BrandMark.module.css";
import {
  createParticleEngine,
  type ParticleEngineState,
  type ParticlePhase,
  type ParticlePoint,
} from "./particleEngine";
import { sampleTextPixels } from "./sampleTextPixels";

type Trigger = "mount" | "hover";
type WordmarkState = "from" | "to";
type ParticleVisualState = "idle" | ParticlePhase;

type ParticleTimings = {
  dissolveEndMs: number;
  funnelEndMs: number;
  settleEndMs: number;
  completeMs: number;
};

type ParticleTargetBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type Metrics = {
  posY: number;
  posIFinal: number;
  shift: number;
};

type AnimationRefs = {
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

const PARTICLE_SAMPLING_TIMEOUT_MS = 500;
const HOVER_REPLAY_COOLDOWN_MS = 1200;
const PARTICLE_SAMPLE_SEED = 20260223;

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

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function easeOutCubic(value: number): number {
  const normalized = clamp(value, 0, 1);
  return 1 - (1 - normalized) ** 3;
}

function hashUnit(value: number): number {
  const raw = Math.sin(value * 12.9898) * 43758.5453;
  return raw - Math.floor(raw);
}

function mixRgb(
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

function resolveCssColorToRgb(color: string, fallback: [number, number, number]): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.position = "absolute";
  probe.style.left = "-10000px";
  probe.style.color = color;
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();
  return parseRgbColor(resolved) ?? fallback;
}

function waitForFontsReady(timeoutMs: number): Promise<boolean> {
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

function waitForWidthStability(element: HTMLElement, timeoutMs: number): Promise<boolean> {
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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)" // i18n-exempt -- OPS-123 [ttl=2026-12-31] media query string, not user-facing copy
    );
    if (!mql) return;

    const update = () => setReduced(mql.matches);
    update();

    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useCanHoverReplay(): boolean {
  const [canHoverReplay, setCanHoverReplay] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia?.(
      "(hover: hover) and (pointer: fine)" // i18n-exempt -- OPS-123 [ttl=2026-12-31] media query string, not user-facing copy
    );
    if (!mql) return;

    const update = () => setCanHoverReplay(mql.matches);
    update();

    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return canHoverReplay;
}

function useBrandMarkMetrics(
  rootRef: React.RefObject<HTMLSpanElement | null>,
  measureRef: React.RefObject<HTMLSpanElement | null>
): { ready: boolean; metrics: Metrics | null } {
  const [ready, setReady] = React.useState(false);
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);

  const measure = React.useCallback(() => {
    const host = measureRef.current;
    if (!host) return;

    const getW = (key: string) => {
      const el = host.querySelector<HTMLElement>(`[data-key="${key}"]`);
      return el ? el.getBoundingClientRect().width : 0;
    };

    const wCary = getW("Cary");
    const wY = getW("y");
    const wCaryi = getW("Caryi");
    const wCari = getW("Cari");
    const wI = getW("i");

    const posY = wCary - wY;
    const posIInitial = wCaryi - wI;
    const posIFinal = wCari - wI;
    const shift = posIInitial - posIFinal;

    setMetrics({ posY, posIFinal, shift });
    setReady(true);
  }, [measureRef]);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
        if (fonts?.ready) await fonts.ready;
      } catch {
        // proceed with currently available fonts
      }

      if (cancelled) return;
      requestAnimationFrame(() => {
        if (!cancelled) measure();
      });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [measure]);

  React.useEffect(() => {
    if (!rootRef.current) return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [measure, rootRef]);

  return { ready, metrics };
}

function buildParticleTimings(mode: Trigger): ParticleTimings {
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

function downsamplePairedPoints(params: {
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

function resolveParticleTargetBounds(
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

function computeTaglineRevealFromParticles(params: {
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

function applyTaglineRevealStyle(root: HTMLSpanElement, revealProgress: number): void {
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

function buildParticlePoints(
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

async function runParticleAnimation(params: {
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

function useBrandMarkAnimationController(options: {
  shouldAnimate: boolean;
  trigger: Trigger;
  delayMs: number;
  tagline: string;
  ready: boolean;
  metrics: Metrics | null;
  canHoverReplay: boolean;
  refs: AnimationRefs;
}): {
  state: WordmarkState;
  particleState: ParticleVisualState;
  canvasActive: boolean;
  onPointerEnter: () => void;
} {
  const {
    shouldAnimate,
    trigger,
    delayMs,
    tagline,
    ready,
    metrics,
    canHoverReplay,
    refs,
  } = options;

  const [state, setState] = React.useState<WordmarkState>(() => {
    if (!shouldAnimate || trigger === "hover") return "to";
    return "from";
  });
  const [particleState, setParticleState] = React.useState<ParticleVisualState>("idle");
  const [canvasActive, setCanvasActive] = React.useState(false);

  const particleStateRef = React.useRef<ParticleVisualState>("idle");
  const rafRef = React.useRef<number | null>(null);
  const runIdRef = React.useRef(0);
  const hoverReplayAtRef = React.useRef(-Infinity);
  const mountStartedRef = React.useRef(false);

  const setParticleVisualState = React.useCallback((next: ParticleVisualState) => {
    if (particleStateRef.current === next) return;
    particleStateRef.current = next;
    setParticleState(next);
  }, []);

  const stopParticleLoop = React.useCallback((nextState: ParticleVisualState) => {
    runIdRef.current += 1;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const root = refs.rootRef.current;
    if (root) {
      applyTaglineRevealStyle(root, nextState === "done" ? 1 : 0);
      if (nextState !== "settling") {
        root.style.setProperty("--tagline-opacity", nextState === "done" ? "1" : "0");
        root.style.setProperty("--tagline-blur", nextState === "done" ? "0px" : "0.8px");
      }
    }
    setCanvasActive(false);
    setParticleVisualState(nextState);
  }, [refs.rootRef, setParticleVisualState]);

  React.useEffect(() => {
    if (!ready || !metrics) return;

    if (!shouldAnimate) {
      mountStartedRef.current = false;
      setState("to");
      stopParticleLoop("done");
      return;
    }

    if (trigger !== "mount") {
      mountStartedRef.current = false;
      setState("to");
      stopParticleLoop("done");
      return;
    }

    if (mountStartedRef.current) {
      return;
    }
    mountStartedRef.current = true;

    setState("from");
    stopParticleLoop("idle");

    const timeoutId = window.setTimeout(() => {
      setState("to");
      void runParticleAnimation({
        mode: "mount",
        tagline,
        refs,
        runIdRef,
        rafRef,
        setCanvasActive,
        setParticleVisualState,
        stopParticleLoop,
      });
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    delayMs,
    metrics,
    ready,
    refs,
    setParticleVisualState,
    shouldAnimate,
    stopParticleLoop,
    tagline,
    trigger,
  ]);

  React.useEffect(() => {
    return () => {
      runIdRef.current += 1;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const onPointerEnter = React.useCallback(() => {
    if (!ready || !metrics) return;
    if (!shouldAnimate || trigger !== "hover" || !canHoverReplay) return;

    const now = performance.now();
    if (now - hoverReplayAtRef.current < HOVER_REPLAY_COOLDOWN_MS) return;
    hoverReplayAtRef.current = now;

    setState("from");
    stopParticleLoop("idle");

    requestAnimationFrame(() => {
      setState("to");
      void runParticleAnimation({
        mode: "hover",
        tagline,
        refs,
        runIdRef,
        rafRef,
        setCanvasActive,
        setParticleVisualState,
        stopParticleLoop,
      });
    });
  }, [
    canHoverReplay,
    metrics,
    ready,
    refs,
    setParticleVisualState,
    shouldAnimate,
    stopParticleLoop,
    tagline,
    trigger,
  ]);

  return {
    state,
    particleState,
    canvasActive,
    onPointerEnter,
  };
}

function buildBrandInlineStyle(params: {
  durationMs: number;
  shouldAnimate: boolean;
  metrics: Metrics | null;
}): React.CSSProperties {
  const { durationMs, shouldAnimate, metrics } = params;
  const base: React.CSSProperties = {
    "--dur": `${durationMs}ms`,
    "--tagline-reveal": shouldAnimate ? 0 : 1,
  } as React.CSSProperties;

  if (!metrics) {
    return base;
  }

  return {
    ...base,
    "--pos-y": `${metrics.posY}px`,
    "--pos-i-final": `${metrics.posIFinal}px`,
    "--shift": `${metrics.shift}px`,
  } as React.CSSProperties;
}

function resolveFallbackText(shouldAnimate: boolean, trigger: Trigger): string {
  return shouldAnimate && trigger === "mount" ? "Caryina" : "Carina";
}

export function BrandMark({
  className,
  trigger = "mount",
  animate = true,
  delayMs = 280,
  durationMs = 900,
  reserveWidth = "max",
  ariaLabel = "Carina",
  tagline = "Un solo dettaglio. Quello carino.", // i18n-exempt -- OPS-123 [ttl=2026-12-31] Italian brand tagline, not translatable copy
  showTagline = true,
}: BrandMarkProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const shouldAnimate = animate && !prefersReducedMotion;
  const canHoverReplay = useCanHoverReplay();

  const rootRef = React.useRef<HTMLSpanElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const measureRef = React.useRef<HTMLSpanElement | null>(null);
  const yRef = React.useRef<HTMLSpanElement | null>(null);
  const taglineRef = React.useRef<HTMLSpanElement | null>(null);

  const { ready, metrics } = useBrandMarkMetrics(rootRef, measureRef);
  const { state, particleState, canvasActive, onPointerEnter } =
    useBrandMarkAnimationController({
      shouldAnimate,
      trigger,
      delayMs,
      tagline,
      ready,
      metrics,
      canHoverReplay,
      refs: {
        rootRef,
        canvasRef,
        yRef,
        taglineRef,
      },
    });

  const fallbackText = resolveFallbackText(shouldAnimate, trigger);
  const rootStyle = buildBrandInlineStyle({
    durationMs,
    shouldAnimate,
    metrics,
  });

  return (
    <span
      ref={rootRef}
      className={[styles.brand, className].filter(Boolean).join(" ")}
      data-ready={ready ? "true" : "false"}
      data-state={state}
      data-particle-state={particleState}
      data-particle-active={canvasActive ? "true" : "false"}
      data-reserve={reserveWidth}
      style={rootStyle}
      role="img"
      aria-label={ariaLabel}
      onPointerEnter={onPointerEnter}
    >
      <span className={styles.fallback} aria-hidden="true">
        {fallbackText}
      </span>

      <span className={styles.composed} aria-hidden="true">
        <span className={styles.baseline}>
          {reserveWidth === "max" ? "Caryina" : "Carina"}
        </span>

        <span className={styles.layer}>
          <span className={styles.car} style={{ left: 0 }}>
            Car
          </span>
          <span
            ref={yRef}
            className={styles.y}
            style={{ left: "var(--pos-y, 0px)" }}
          >
            y
          </span>
          <span
            className={styles.ina}
            style={{ left: "var(--pos-i-final, 0px)" }}
          >
            ina
          </span>
        </span>
      </span>

      {shouldAnimate && (
        <canvas
          ref={canvasRef}
          className={styles.particleCanvas}
          aria-hidden="true"
          role="presentation"
        />
      )}

      <span ref={measureRef} className={styles.measure} aria-hidden="true">
        <span data-key="Cary">Cary</span>
        <span data-key="y">y</span>
        <span data-key="Caryi">Caryi</span>
        <span data-key="Cari">Cari</span>
        <span data-key="i">i</span>
      </span>

      {showTagline && tagline && (
        <span ref={taglineRef} className={styles.tagline} aria-hidden="true">
          {tagline}
        </span>
      )}
    </span>
  );
}
