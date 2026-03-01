"use client";

import React from "react";

import styles from "./BrandMark.module.css";
import {
  useBrandMarkAnimationController,
  useBrandMarkMetrics,
  useCanHoverReplay,
  usePrefersReducedMotion,
} from "./brandMarkHooks";
import { buildBrandInlineStyle, resolveFallbackText } from "./brandMarkPresentation";
import type { BrandMarkProps } from "./brandMarkTypes";

export type { BrandMarkProps } from "./brandMarkTypes";

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
