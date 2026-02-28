// packages/ui/src/molecules/ThemeToggle.tsx
// Scenic day/night toggle — pill switch with animated sun/moon, clouds & stars.
// Inspired by the Figma "Button 29" community toggle design.
import { type CSSProperties,memo, useCallback } from "react";

import { useTranslations } from "@acme/i18n";

import { useTheme } from "../hooks/useTheme";

/* ── transition ─────────────────────────────────────────────────────── */
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const MS = "500ms";

/* ── layout (px) ────────────────────────────────────────────────────── */
const W = 70;
const H = 32;
const PAD = 3;
const THUMB = H - PAD * 2; // 26
const TRAVEL = W - THUMB - PAD * 2; // 38

/* ── scenic element configs ─────────────────────────────────────────── */
interface Star {
  x: number;
  y: number;
  r: number;
  d: number;
}
interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
}

/** Star positions (% from left/top) — scattered in the left half */
const STARS: Star[] = [
  { x: 10, y: 22, r: 1.5, d: 0 },
  { x: 25, y: 58, r: 1, d: 80 },
  { x: 16, y: 76, r: 1.5, d: 160 },
  { x: 40, y: 18, r: 1, d: 240 },
  { x: 6, y: 48, r: 1, d: 320 },
  { x: 32, y: 42, r: 1.5, d: 400 },
];

/** Cloud positions — scattered in the right half */
const CLOUDS: Cloud[] = [
  { x: 54, y: 16, w: 18, h: 7, d: 0 },
  { x: 67, y: 50, w: 14, h: 5, d: 60 },
  { x: 50, y: 72, w: 10, h: 4, d: 120 },
];

/* ── palette ────────────────────────────────────────────────────────── */
const SKY_DAY = "linear-gradient(180deg, var(--color-brand-primary) 0%, var(--color-brand-secondary) 100%)";
const SKY_NIGHT = "linear-gradient(180deg, var(--color-brand-bg) 0%, var(--color-brand-surface) 100%)";
const SUN_COLOR = "var(--color-brand-secondary)";
const SUN_GLOW = "0 0 8px 3px rgba(244,211,94,0.4)";
const MOON_COLOR = "var(--color-brand-muted)";
const MOON_GLOW = "0 0 6px 2px rgba(200,204,208,0.15)";
const CRESCENT = "var(--color-brand-bg)";

/* ── helpers ─────────────────────────────────────────────────────────── */
function starStyle(s: Star, dark: boolean): CSSProperties {
  return {
    position: "absolute",
    left: `${s.x}%`,
    top: `${s.y}%`,
    width: s.r * 2,
    height: s.r * 2,
    borderRadius: "50%",
    background: "var(--color-brand-heading)",
    opacity: dark ? 0.9 : 0,
    transform: dark ? "scale(1)" : "scale(0)",
    transition: `opacity ${MS} ${EASE} ${s.d}ms, transform ${MS} ${EASE} ${s.d}ms`,
    animation: dark ? `scenic-twinkle ${2 + s.d / 200}s ease-in-out ${s.d + 600}ms infinite` : "none",
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

/* ── component ──────────────────────────────────────────────────────── */
export const ThemeToggle = memo((): JSX.Element => {
  const { setTheme, isDark } = useTheme();
  const t = useTranslations();
  const toggle = useCallback(
    () => setTheme(isDark ? "light" : "dark"),
    [isDark, setTheme],
  );

  return (
    <button
      type="button"
      onClick={toggle}
      title={isDark ? t("themeToggle.switchToLight") : t("themeToggle.switchToDark")}
      aria-label={isDark ? t("themeToggle.enableLight") : t("themeToggle.enableDark")}
      className="scenic-toggle relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-0 p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary min-h-11 min-w-11"
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
      {/* stars — fade + scale in when dark, with staggered twinkle */}
      {STARS.map((s, i) => (
        <span key={`s${i}`} aria-hidden="true" style={starStyle(s, isDark)} />
      ))}

      {/* clouds — visible in day, drift right + fade in dark */}
      {CLOUDS.map((c, i) => (
        <span key={`c${i}`} aria-hidden="true" style={cloudStyle(c, isDark)} />
      ))}

      {/* thumb — golden sun (day) / crescent moon (night) */}
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
        {/* crescent overlay — dark circle bites upper-right to form moon */}
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
  );
});
ThemeToggle.displayName = "ThemeToggle";

export default ThemeToggle;
