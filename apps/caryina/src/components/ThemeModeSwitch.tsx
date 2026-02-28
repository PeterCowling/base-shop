"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ResolvedMode = "light" | "dark";

// ── Storage keys ──────────────────────────────────────────────────────────────

const THEME_MODE_KEY = "theme-mode";
const THEME_NAME_KEY = "theme-name";
const LEGACY_THEME_KEY = "theme";

// ── Pure utilities ────────────────────────────────────────────────────────────

function getSystemMode(): ResolvedMode {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function readStoredMode(): ResolvedMode | "system" | null {
  try {
    const stored = window.localStorage.getItem(THEME_MODE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (stored === "system") return "system";
    const legacy = window.localStorage.getItem(LEGACY_THEME_KEY);
    if (legacy === "dark") return "dark";
    if (legacy === "light" || legacy === "base") return "light";
    if (legacy === "system") return "system";
  } catch {
    // ignore
  }
  return null;
}

function applyResolvedMode(mode: ResolvedMode): void {
  const root = document.documentElement;
  root.classList.toggle("theme-dark", mode === "dark");
  root.classList.toggle("dark", mode === "dark");
  root.style.colorScheme = mode;
}

function persistMode(mode: ResolvedMode | "system"): void {
  try {
    if (mode === "system") {
      window.localStorage.setItem(THEME_MODE_KEY, "system");
      window.localStorage.setItem(THEME_NAME_KEY, "base");
      window.localStorage.setItem(LEGACY_THEME_KEY, "system");
    } else {
      window.localStorage.setItem(THEME_MODE_KEY, mode);
      window.localStorage.setItem(THEME_NAME_KEY, "base");
      window.localStorage.setItem(LEGACY_THEME_KEY, mode === "dark" ? "dark" : "base");
    }
  } catch {
    // ignore
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const SunIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx={12} cy={12} r={4} />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

const MoonIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

// Written as full string literals so Tailwind JIT scans and includes them
const SUN_ACTIVE_CLASS = "text-warning-main";
const MOON_ACTIVE_CLASS = "text-info-main";

// ── Nudge keyframes ───────────────────────────────────────────────────────────
//
// --pill-translate is a CSS custom property set inline on the pill element.
// The keyframe references it so the nudge scale happens in-place regardless
// of whether the pill is in the light (translateX(0)) or dark (translateX(100%))
// position — the horizontal translation is never disturbed.
//
const NUDGE_KEYFRAMES = `
@keyframes tm-nudge {
  0%   { transform: var(--pill-translate) scale(1); }
  30%  { transform: var(--pill-translate) scale(0.86); }
  65%  { transform: var(--pill-translate) scale(1.05); }
  100% { transform: var(--pill-translate) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes tm-nudge { 0%, 100% { transform: var(--pill-translate); } }
}
`;

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// ── Component ─────────────────────────────────────────────────────────────────

export function ThemeModeSwitch() {
  const [resolved, setResolved] = useState<ResolvedMode>("light");
  const [mounted, setMounted] = useState(false);
  const [hasOverride, setHasOverride] = useState(false);
  const [nudging, setNudging] = useState(false);

  // Ref copy of hasOverride for use in the MQL closure, which cannot
  // close over React state reliably.
  const hasOverrideRef = useRef(false);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = readStoredMode();
    const isExplicit = stored !== null && stored !== "system";
    hasOverrideRef.current = isExplicit;
    setHasOverride(isExplicit);

    const initial = isExplicit ? (stored as ResolvedMode) : getSystemMode();
    setResolved(initial);
    applyResolvedMode(initial);
    setMounted(true);

    // Follow system preference while no explicit override is stored.
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      if (hasOverrideRef.current) return;
      const next: ResolvedMode = mql.matches ? "dark" : "light";
      setResolved(next);
      applyResolvedMode(next);
    };
    mql.addEventListener("change", handleSystemChange);
    return () => {
      mql.removeEventListener("change", handleSystemChange);
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    };
  }, []);

  // ── Callbacks ──────────────────────────────────────────────────────────────

  const setTheme = useCallback((next: ResolvedMode) => {
    // Cancel any in-progress nudge so the slide transition is not suppressed.
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    setNudging(false);

    hasOverrideRef.current = true;
    setHasOverride(true);
    setResolved(next);
    applyResolvedMode(next);
    persistMode(next);
  }, []);

  const clearOverride = useCallback(() => {
    hasOverrideRef.current = false;
    setHasOverride(false);
    persistMode("system");
    const sysMode = getSystemMode();
    setResolved(sysMode);
    applyResolvedMode(sysMode);
  }, []);

  // Restart the nudge CSS animation by toggling the nudging flag off/on across
  // a single animation frame — this forces the browser to re-attach the
  // animation even on rapid repeated clicks.
  const triggerNudge = useCallback(() => {
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    setNudging(false);
    requestAnimationFrame(() => {
      setNudging(true);
      nudgeTimerRef.current = setTimeout(() => setNudging(false), 340);
    });
  }, []);

  const handleModeButton = useCallback(
    (next: ResolvedMode) => {
      if (next === resolved && hasOverrideRef.current) {
        triggerNudge();
        return;
      }
      setTheme(next);
    },
    [resolved, setTheme, triggerNudge]
  );

  // ── Skeleton (pre-mount) ───────────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="relative">
        <div className="h-11 w-20 rounded-full border border-border bg-muted" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const pillTranslate = resolved === "dark" ? "translateX(100%)" : "translateX(0)";

  // The pill uses position:absolute with a fixed left:4px and GPU-composited
  // translateX. translateX(100%) = 100% of the pill's own width, which equals
  // exactly (containerWidth/2 - 4px) — the precise offset to the right button.
  const pillStyle: React.CSSProperties = {
    ["--pill-translate" as string]: pillTranslate,
    transform: pillTranslate,
    transition: nudging ? "none" : `transform 380ms ${SPRING}`,
    willChange: "transform",
    ...(nudging ? { animation: `tm-nudge 300ms ${SPRING} forwards` } : {}),
  };

  return (
    <div className="relative">
      <style>{NUDGE_KEYFRAMES}</style>

      {/* Toggle track — title tooltip surfaces the reset affordance for mouse users */}
      <div
        role="radiogroup"
        aria-label="Theme"
        title={hasOverride ? "Reset to automatic" : undefined}
        className="relative inline-flex h-11 items-center rounded-full border border-border bg-muted p-1"
      >
        {/* Sliding pill — sits behind the buttons via z-index */}
        <div
          aria-hidden="true"
          className="absolute rounded-full bg-bg shadow-sm"
          style={{
            ...pillStyle,
            insetInlineStart: "0.25rem",
            insetBlockStart: "0.25rem",
            inlineSize: "calc(50% - 0.25rem)",
            blockSize: "calc(100% - 0.5rem)",
          }}
        />

        {/* Light button */}
        <button
          type="button"
          role="radio"
          aria-checked={resolved === "light" && hasOverride}
          aria-label="Switch to light mode"
          onClick={() => handleModeButton("light")}
          className={[
            "relative z-10 flex h-full w-10 min-h-11 min-w-11 items-center justify-center rounded-full",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100",
            resolved === "light" ? SUN_ACTIVE_CLASS : "text-fg-muted hover:text-fg",
          ].join(" ")}
        >
          <SunIcon className="h-5 w-5" />
        </button>

        {/* Dark button */}
        <button
          type="button"
          role="radio"
          aria-checked={resolved === "dark" && hasOverride}
          aria-label="Switch to dark mode"
          onClick={() => handleModeButton("dark")}
          className={[
            "relative z-10 flex h-full w-10 min-h-11 min-w-11 items-center justify-center rounded-full",
            "transition-colors duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100",
            resolved === "dark" ? MOON_ACTIVE_CLASS : "text-fg-muted hover:text-fg",
          ].join(" ")}
        >
          <MoonIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Reset button shown only when an override is active. */}
      {hasOverride && (
        <button
          type="button"
          aria-label="Return to automatic mode"
          onClick={clearOverride}
          className="mt-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-surface px-3 text-xs text-fg-muted transition-colors hover:text-fg"
        >
          Auto
        </button>
      )}
    </div>
  );
}
