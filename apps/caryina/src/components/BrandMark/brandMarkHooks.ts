"use client";

import React from "react";

import type { AnimationRefs, Metrics, ParticleVisualState, Trigger, WordmarkState } from "./brandMarkTypes";
import { applyTaglineRevealStyle,HOVER_REPLAY_COOLDOWN_MS } from "./brandMarkUtils";
import { runParticleAnimation } from "./runParticleAnimation";

export function usePrefersReducedMotion(): boolean {
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

export function useCanHoverReplay(): boolean {
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

export function useBrandMarkMetrics(
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

export function useBrandMarkAnimationController(options: {
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
