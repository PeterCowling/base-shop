/* eslint-disable ds/no-nonlayered-zindex -- CARYINA-104 theme toggle thumb requires z-index to overlay scenic elements [ttl=2027-01-01] */
"use client";

import { type CSSProperties, memo, useCallback, useEffect, useState } from "react";

type Mode = "light" | "dark";

function readMode(): Mode {
  try {
    const v = localStorage.getItem("theme-mode");
    if (v === "light" || v === "dark") return v;
    const leg = localStorage.getItem("theme");
    if (leg === "dark") return "dark";
    if (leg === "light" || leg === "base") return "light";
  } catch {
    // ignore
  }
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    // ignore
  }
  return "light";
}

function applyMode(mode: Mode) {
  const root = document.documentElement;
  root.classList.toggle("theme-dark", mode === "dark");
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
  try {
    localStorage.setItem("theme-mode", mode);
    localStorage.setItem("theme", mode === "dark" ? "dark" : "base");
  } catch {
    // ignore
  }
}

/* ── transition ───────────────────────────────────────────────────────── */
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const MS = "500ms";

/* ── layout (px) ─────────────────────────────────────────────────────── */
const W = 70;
const H = 32;
const PAD = 3;
const THUMB = H - PAD * 2; // 26
const TRAVEL = W - THUMB - PAD * 2; // 38

/* ── scenic element configs ───────────────────────────────────────────── */
interface Star { x: number; y: number; r: number; d: number }
interface Cloud { x: number; y: number; w: number; h: number; d: number }

const STARS: Star[] = [
  { x: 10, y: 22, r: 1.5, d: 0 },
  { x: 25, y: 58, r: 1,   d: 80 },
  { x: 16, y: 76, r: 1.5, d: 160 },
  { x: 40, y: 18, r: 1,   d: 240 },
  { x: 6,  y: 48, r: 1,   d: 320 },
  { x: 32, y: 42, r: 1.5, d: 400 },
];

const CLOUDS: Cloud[] = [
  { x: 54, y: 16, w: 18, h: 7, d: 0 },
  { x: 67, y: 50, w: 14, h: 5, d: 60 },
  { x: 50, y: 72, w: 10, h: 4, d: 120 },
];

/* ── palette — caryina token mapping ─────────────────────────────────── */
// Day sky: strawberry-milk pink → warm sage (pastel Italian sunrise)
const SKY_DAY =
  "linear-gradient(180deg, hsl(var(--color-primary)) 0%, hsl(var(--color-accent)) 100%)";
// Night sky: dark bg → dark surface (adapts via html.theme-dark)
const SKY_NIGHT =
  "linear-gradient(180deg, hsl(var(--color-bg)) 0%, hsl(var(--color-surface)) 100%)";
const SUN_COLOR  = "hsl(var(--color-primary))";
const SUN_GLOW   = "0 0 8px 3px rgba(195,120,128,0.45)";
const MOON_COLOR = "hsl(var(--color-fg-muted))";
const MOON_GLOW  = "0 0 6px 2px rgba(200,204,208,0.15)";
// Crescent "bite" — uses the current bg so it adapts between light and dark
const CRESCENT   = "hsl(var(--color-bg))";

/* ── element style helpers ────────────────────────────────────────────── */
function starStyle(s: Star, dark: boolean): CSSProperties {
  return {
    position: "absolute",
    left: `${s.x}%`,
    top: `${s.y}%`,
    width: s.r * 2,
    height: s.r * 2,
    borderRadius: "50%",
    background: "hsl(var(--color-fg))",
    opacity: dark ? 0.9 : 0,
    transform: dark ? "scale(1)" : "scale(0)",
    transition: `opacity ${MS} ${EASE} ${s.d}ms, transform ${MS} ${EASE} ${s.d}ms`,
    animation: dark
      ? `scenic-twinkle ${2 + s.d / 200}s ease-in-out ${s.d + 600}ms infinite`
      : "none",
    pointerEvents: "none",
  };
}

function cloudStyle(c: Cloud, dark: boolean): CSSProperties {
  return {
    position: "absolute",
    left: `${c.x}%`,
    top: `${c.y}%`,
    width: c.w,
    height: c.h,
    borderRadius: 9999,
    background: "rgba(255,255,255,0.85)",
    opacity: dark ? 0 : 1,
    transform: dark ? "translateX(8px)" : "translateX(0)",
    transition: `opacity ${MS} ${EASE} ${c.d}ms, transform ${MS} ${EASE} ${c.d}ms`,
    pointerEvents: "none",
  };
}

/* ── twinkle keyframes (injected once alongside the button) ───────────── */
const TWINKLE_CSS = `
@keyframes scenic-twinkle {
  0%, 100% { opacity: 0.9; transform: scale(1); }
  50%       { opacity: 0.3; transform: scale(0.5); }
}
`;

/* ── component ────────────────────────────────────────────────────────── */
export const HeaderThemeToggle = memo(function HeaderThemeToggle() {
  const [mode, setMode] = useState<Mode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(readMode());
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    const next: Mode = mode === "light" ? "dark" : "light";
    setMode(next);
    applyMode(next);
  }, [mode]);

  // Skeleton — matches toggle dimensions to prevent layout shift
  if (!mounted) {
    return <div style={{ width: W, height: H }} aria-hidden="true" />;
  }

  const isDark = mode === "dark";

  return (
    <>
      <style>{TWINKLE_CSS}</style>
      <button
        type="button"
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-0 p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        style={{
          width: W,
          height: H,
          background: isDark ? SKY_NIGHT : SKY_DAY,
          transition: `background ${MS} ${EASE}`,
          overflow: "hidden",
          boxShadow: isDark
            ? "inset 0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)"
            : "inset 0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {/* Stars — fade + scale in when dark, twinkle after settling */}
        {STARS.map((s, i) => (
          <span key={`s${i}`} aria-hidden="true" style={starStyle(s, isDark)} />
        ))}

        {/* Clouds — visible in day, drift right and fade when dark */}
        {CLOUDS.map((c, i) => (
          <span key={`c${i}`} aria-hidden="true" style={cloudStyle(c, isDark)} />
        ))}

        {/* Thumb — slides right for dark, left for light */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: PAD,
            left: PAD,
            width: THUMB,
            height: THUMB,
            borderRadius: "50%",
            background: isDark ? MOON_COLOR : SUN_COLOR,
            boxShadow: isDark ? MOON_GLOW : SUN_GLOW,
            transform: `translateX(${isDark ? TRAVEL : 0}px)`,
            transition: `all ${MS} ${EASE}`,
            zIndex: 10,
            overflow: "hidden",
          }}
        >
          {/* Crescent overlay — dark circle bites upper-right to form moon */}
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -4,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: CRESCENT,
              opacity: isDark ? 1 : 0,
              transform: isDark ? "translate(0,0)" : "translate(4px,-4px)",
              transition: `all ${MS} ${EASE}`,
              pointerEvents: "none",
            }}
          />
        </span>
      </button>
    </>
  );
});
