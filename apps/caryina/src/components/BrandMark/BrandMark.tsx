"use client";

import React from "react";

import styles from "./BrandMark.module.css";
import {
  createParticleEngine,
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
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
      funnelEndMs: 640,
      settleEndMs: 1200,
      completeMs: 1450,
    };
  }

  return {
    dissolveEndMs: 260,
    funnelEndMs: 1100,
    settleEndMs: 2100,
    completeMs: 2500,
  };
}

function buildParticlePoints(
  tagline: string,
  rootRect: DOMRect,
  yRect: DOMRect,
  taglineRect: DOMRect,
  yElement: HTMLSpanElement,
  taglineElement: HTMLSpanElement
): { sourcePoints: ParticlePoint[]; targetPoints: ParticlePoint[] } {
  const sourceStyle = window.getComputedStyle(yElement);
  const taglineStyle = window.getComputedStyle(taglineElement);

  const sourceSample = sampleTextPixels({
    text: "y",
    font: buildFontString(sourceStyle),
    sampleStep: 1,
    alphaThreshold: 100,
  });
  const targetSample = sampleTextPixels({
    text: tagline,
    font: buildFontString(taglineStyle),
    sampleStep: 1,
    alphaThreshold: 100,
  });

  const sourceOffsetX = yRect.left - rootRect.left;
  const sourceOffsetY = yRect.top - rootRect.top;
  const targetOffsetX = taglineRect.left - rootRect.left;
  const targetOffsetY = taglineRect.top - rootRect.top;

  const rawSourcePoints =
    sourceSample.points.length > 0
      ? sourceSample.points.map((point) => ({
          x: sourceOffsetX + point.x,
          y: sourceOffsetY + point.y,
        }))
      : [
          {
            x: sourceOffsetX + yRect.width * 0.5,
            y: sourceOffsetY + yRect.height * 0.5,
          },
        ];

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

  const targetPoints = [...rawTargetPoints].sort((a, b) => a.x - b.x || a.y - b.y);
  const sourceSorted = [...rawSourcePoints].sort((a, b) => a.x - b.x || a.y - b.y);
  const sourcePoints = targetPoints.map((_, index) => {
    const ratio =
      targetPoints.length <= 1 ? 0 : index / (targetPoints.length - 1);
    const sourceIndex = Math.round(ratio * Math.max(0, sourceSorted.length - 1));
    return sourceSorted[sourceIndex] ?? sourceSorted[0];
  });

  return { sourcePoints, targetPoints };
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

  const { sourcePoints, targetPoints } = buildParticlePoints(
    tagline,
    rootRect,
    yRect,
    taglineRect,
    yElement,
    taglineElement
  );

  const area = cssWidth * cssHeight;
  const densityCap = clamp(Math.round(area / 22), 260, 1400);
  const requiredForTagline = targetPoints.length;
  let particleCount = clamp(requiredForTagline, 220, densityCap);
  if (window.innerWidth < 480) {
    particleCount = clamp(requiredForTagline, 200, 960);
  }

  const timings = buildParticleTimings(mode);
  const neckX = yRect.left - rootRect.left + yRect.width * 0.5;
  const baselineY = yRect.top - rootRect.top + yRect.height;

  const engine = createParticleEngine({
    particleCount,
    sourcePoints,
    targetPoints,
    baselineY,
    neckX,
    neckHalfWidth: Math.max(8, yRect.width * 0.25),
    dissolveEndMs: timings.dissolveEndMs,
    funnelEndMs: timings.funnelEndMs,
    settleEndMs: timings.settleEndMs,
    completeMs: timings.completeMs,
    viewportWidth: cssWidth,
    viewportHeight: cssHeight,
  });

  const rootStyle = window.getComputedStyle(root);
  const primaryColor = resolveCssColorToRgb(rootStyle.color, [224, 142, 149]);
  const accentToken = rootStyle.getPropertyValue("--brand-accent-color").trim();
  const accentColor = resolveCssColorToRgb(
    accentToken ? `hsl(${accentToken})` : "hsl(130 18% 72%)",
    [167, 198, 174]
  );

  let lastFrameAt = performance.now();
  root.style.setProperty("--tagline-reveal", "0");
  setCanvasActive(true);
  setParticleVisualState("dissolving");

  const frame = (now: number) => {
    if (runId !== runIdRef.current) return;

    const deltaMs = now - lastFrameAt;
    lastFrameAt = now;

    const next = engine.tick(deltaMs);
    setParticleVisualState(next.phase);

    const reveal =
      next.phase === "settling"
        ? clamp(next.settledCount / Math.max(1, next.particleCount), 0, 1)
        : next.phase === "done"
          ? 1
          : 0;
    root.style.setProperty("--tagline-reveal", reveal.toFixed(3));

    context.clearRect(0, 0, cssWidth, cssHeight);
    const blend = clamp(
      (next.elapsedMs - timings.dissolveEndMs) /
        Math.max(1, timings.settleEndMs - timings.dissolveEndMs),
      0,
      1
    );

    const red = Math.round(lerp(primaryColor[0], accentColor[0], blend));
    const green = Math.round(lerp(primaryColor[1], accentColor[1], blend));
    const blue = Math.round(lerp(primaryColor[2], accentColor[2], blend));
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.9)`;

    for (let index = 0; index < next.particleCount; index += 1) {
      if (next.active[index] !== 1) continue;
      const x = next.x[index];
      const y = next.y[index];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;

      context.beginPath();
      context.arc(x, y, 0.85 + (index % 4) * 0.14, 0, Math.PI * 2);
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
      root.style.setProperty("--tagline-reveal", nextState === "done" ? "1" : "0");
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
  delayMs: number;
  shouldAnimate: boolean;
  metrics: Metrics | null;
}): React.CSSProperties {
  const { durationMs, delayMs, shouldAnimate, metrics } = params;
  const base: React.CSSProperties = {
    "--dur": `${durationMs}ms`,
    "--delay": `${delayMs}ms`,
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
    delayMs,
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
