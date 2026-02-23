"use client";

import React from "react";

import styles from "./BrandMark.module.css";

type Trigger = "mount" | "hover";

export type BrandMarkProps = {
  className?: string;

  /**
   * "mount": plays once after hydration + font measurement (default).
   * "hover": stays as Carina, replays the Caryina→Carina motion on hover.
   */
  trigger?: Trigger;

  /** Set false to render the final "Carina" without motion. */
  animate?: boolean;

  /** Delay before the transformation begins (ms). */
  delayMs?: number;

  /** Duration of the movement/fade (ms). */
  durationMs?: number;

  /**
   * "max" reserves width for "Caryina" (prevents header reflow).
   * "final" reserves width for "Carina" (tighter, but "Caryina" may overflow during motion).
   */
  reserveWidth?: "max" | "final";

  /** Accessible label for the logo. */
  ariaLabel?: string;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mql =
      window.matchMedia?.("(prefers-reduced-motion: reduce)"); // i18n-exempt -- OPS-123 [ttl=2026-12-31] media query string, not user-facing copy
    if (!mql) return;

    const update = () => setReduced(mql.matches);
    update();

    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return reduced;
}

type Metrics = {
  posY: number;
  posIFinal: number;
  shift: number;
};

export function BrandMark({
  className,
  trigger = "mount",
  animate = true,
  delayMs = 280,
  durationMs = 900,
  reserveWidth = "max",
  ariaLabel = "Carina",
}: BrandMarkProps) {
  const prefersReduced = usePrefersReducedMotion();

  const rootRef = React.useRef<HTMLSpanElement | null>(null);
  const measureRef = React.useRef<HTMLSpanElement | null>(null);

  const [ready, setReady] = React.useState(false);
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);

  const [state, setState] = React.useState<"from" | "to">(() => {
    if (!animate) return "to";
    if (trigger === "hover") return "to";
    return "from";
  });

  const shouldAnimate = animate && !prefersReduced;

  const measure = React.useCallback(() => {
    const host = measureRef.current;
    if (!host) return;

    const getW = (key: string) => {
      const el = host.querySelector<HTMLElement>(`[data-key="${key}"]`);
      if (!el) return 0;
      return el.getBoundingClientRect().width;
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
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- OPS-123: FontFaceSet typing is not consistent across runtime/lib versions.
        const fonts: any = (document as any).fonts;
        if (fonts?.ready) await fonts.ready;
      } catch {
        /* measure with whatever is available */
      }

      if (cancelled) return;

      requestAnimationFrame(() => {
        if (cancelled) return;
        measure();
      });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [measure]);

  React.useEffect(() => {
    if (!rootRef.current) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(rootRef.current);

    return () => ro.disconnect();
  }, [measure]);

  React.useEffect(() => {
    if (!ready) return;

    if (!shouldAnimate) {
      setState("to");
      return;
    }

    if (trigger !== "mount") {
      setState("to");
      return;
    }

    setState("from");
    const t = window.setTimeout(() => setState("to"), delayMs);
    return () => window.clearTimeout(t);
  }, [ready, shouldAnimate, trigger, delayMs]);

  const onPointerEnter = React.useCallback(() => {
    if (!ready) return;
    if (!shouldAnimate) return;
    if (trigger !== "hover") return;

    setState("from");
    requestAnimationFrame(() => setState("to"));
  }, [ready, shouldAnimate, trigger]);

  const fallbackText =
    shouldAnimate && trigger === "mount" ? "Caryina" : "Carina";

  return (
    <span
      ref={rootRef}
      className={[styles.brand, className].filter(Boolean).join(" ")}
      data-ready={ready ? "true" : "false"}
      data-state={state}
      data-reserve={reserveWidth}
      style={
        metrics
          ? ({
              "--dur": `${durationMs}ms`,
              "--delay": `${delayMs}ms`,
              "--pos-y": `${metrics.posY}px`,
              "--pos-i-final": `${metrics.posIFinal}px`,
              "--shift": `${metrics.shift}px`,
            } as React.CSSProperties)
          : ({
              "--dur": `${durationMs}ms`,
              "--delay": `${delayMs}ms`,
            } as React.CSSProperties)
      }
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
          <span className={styles.y} style={{ left: "var(--pos-y, 0px)" }}>
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

      <span ref={measureRef} className={styles.measure} aria-hidden="true">
        <span data-key="Cary">Cary</span>
        <span data-key="y">y</span>
        <span data-key="Caryi">Caryi</span>
        <span data-key="Cari">Cari</span>
        <span data-key="i">i</span>
      </span>
    </span>
  );
}
