// packages/ui/src/lib/useThemePalette.ts
// Defines 7 hue families with 12 steps and maps semantic tokens to steps.
// This is a scaffold; values are placeholders aligned to Radix-like use.

export type HueFamily =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "info"
  | "warning"
  | "danger";

export type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type Mode = "light" | "dark";

export type Ramp = Record<Step, string>; // HSL components, e.g. "220 80% 60%"

export interface Palette {
  neutral: Ramp;
  primary: Ramp;
  accent: Ramp;
  success: Ramp;
  info: Ramp;
  warning: Ramp;
  danger: Ramp;
}

export type SemanticToken =
  | "--color-bg-1"
  | "--color-bg-2"
  | "--color-bg-3"
  | "--color-bg-4"
  | "--color-bg-5"
  | "--color-panel"
  | "--color-inset"
  | "--color-border"
  | "--color-border-strong"
  | "--color-border-muted"
  | "--color-fg"
  | "--color-fg-muted"
  | "--color-primary-soft"
  | "--color-primary"
  | "--color-primary-hover"
  | "--color-primary-active"
  | "--color-primary-fg"
  | "--color-accent-soft"
  | "--color-accent"
  | "--color-accent-fg"
  | "--color-success-soft"
  | "--color-success"
  | "--color-success-fg"
  | "--color-info-soft"
  | "--color-info"
  | "--color-info-fg"
  | "--color-warning-soft"
  | "--color-warning"
  | "--color-warning-fg"
  | "--color-danger-soft"
  | "--color-danger"
  | "--color-danger-fg"
  | "--color-focus-ring"
  | "--color-selection"
  | "--color-highlight"
  | "--color-link"
  | "--overlay-scrim-1"
  | "--overlay-scrim-2";

export interface TokenStepMap {
  family: HueFamily;
  step?: Step; // not required for computed tokens (e.g., auto foreground)
  // Optional: alternative per-mode step override
  light?: Step;
  dark?: Step;
  // Special handling for foreground selection
  autoFg?: boolean;
}

// Step matrix per the proposal
const matrix: Record<SemanticToken, TokenStepMap> = {
  // Neutral surfaces & text
  "--color-bg-1": { family: "neutral", step: 1 },
  "--color-bg-2": { family: "neutral", step: 2 },
  "--color-bg-3": { family: "neutral", step: 3 },
  "--color-bg-4": { family: "neutral", step: 4 },
  "--color-bg-5": { family: "neutral", step: 5 },
  "--color-panel": { family: "neutral", step: 3 },
  "--color-inset": { family: "neutral", step: 2 },
  "--color-border": { family: "neutral", step: 6 },
  "--color-border-strong": { family: "neutral", step: 7 },
  "--color-border-muted": { family: "neutral", step: 5 },
  "--color-fg": { family: "neutral", step: 12 },
  "--color-fg-muted": { family: "neutral", step: 10 },
  // Primary & Accent
  "--color-primary-soft": { family: "primary", step: 3 },
  "--color-primary": { family: "primary", step: 9 },
  "--color-primary-hover": { family: "primary", step: 10 },
  "--color-primary-active": { family: "primary", step: 11 },
  "--color-primary-fg": { family: "neutral", autoFg: true },
  "--color-accent-soft": { family: "accent", step: 3 },
  "--color-accent": { family: "accent", step: 9 },
  "--color-accent-fg": { family: "neutral", autoFg: true },
  // Statuses
  "--color-success-soft": { family: "success", step: 3 },
  "--color-success": { family: "success", step: 9 },
  "--color-success-fg": { family: "neutral", autoFg: true },
  "--color-info-soft": { family: "info", step: 3 },
  "--color-info": { family: "info", step: 9 },
  "--color-info-fg": { family: "neutral", autoFg: true },
  "--color-warning-soft": { family: "warning", step: 3 },
  "--color-warning": { family: "warning", step: 9 },
  "--color-warning-fg": { family: "neutral", autoFg: true },
  "--color-danger-soft": { family: "danger", step: 3 },
  "--color-danger": { family: "danger", step: 9 },
  "--color-danger-fg": { family: "neutral", autoFg: true },
  // Helpers
  "--color-focus-ring": { family: "primary", step: 9 },
  "--color-selection": { family: "accent", light: 4, dark: 8 },
  "--color-highlight": { family: "accent", light: 3, dark: 7 },
  "--color-link": { family: "primary", step: 9 },
  // Overlays are neutral with alpha; steps are informational
  "--overlay-scrim-1": { family: "neutral", step: 12 },
  "--overlay-scrim-2": { family: "neutral", step: 12 },
};

// Very simple neutral ramp approximation for scaffolding
const neutralRamp: Ramp = {
  1: "0 0% 100%",
  2: "0 0% 98%",
  3: "0 0% 96%",
  4: "0 0% 94%",
  5: "0 0% 92%",
  6: "0 0% 80%",
  7: "0 0% 65%",
  8: "0 0% 50%",
  9: "0 0% 35%",
  10: "0 0% 25%",
  11: "0 0% 15%",
  12: "0 0% 10%",
};

// Simple primary/accent/status ramps for scaffolding purposes
function hueRamp(h: number): Ramp {
  return {
    1: `${h} 90% 99%`,
    2: `${h} 90% 97%`,
    3: `${h} 90% 94%`,
    4: `${h} 88% 88%`,
    5: `${h} 86% 80%`,
    6: `${h} 84% 72%`,
    7: `${h} 82% 64%`,
    8: `${h} 80% 58%`,
    9: `${h} 78% 52%`,
    10: `${h} 76% 46%`,
    11: `${h} 74% 40%`,
    12: `${h} 70% 36%`,
  };
}

// Default palette scaffold (light mode intent); in dark mode, consumers flip which steps are sampled
export const defaultPalette: Palette = {
  neutral: neutralRamp,
  primary: hueRamp(220),
  accent: hueRamp(260),
  success: hueRamp(142),
  info: hueRamp(210),
  warning: hueRamp(40),
  danger: hueRamp(0),
};

// Compute neutral foreground automatically to meet contrast where possible.
function autoForeground(neutral: Ramp, mode: Mode): string {
  return mode === "light" ? neutral[12] : neutral[1];
}

export function mapTokensToCssVars(palette: Palette, mode: Mode): Record<string, string> {
  const pick = (family: HueFamily, m: TokenStepMap): string => {
    const ramp = palette[family];
    if (m.autoFg) return autoForeground(palette.neutral, mode);
    const step = (mode === "light" ? m.light : m.dark) ?? m.step ?? 9;
    return ramp[step];
  };

  const out: Record<string, string> = {};
  (Object.keys(matrix) as SemanticToken[]).forEach((t) => {
    const m = matrix[t];
    // Overlays are special: attach alpha in the consumer; keep HSL components here
    out[t] = pick(m.family, m);
  });
  return out;
}

export function useThemePalette() {
  // Hook surface for future dynamic palette selection/presets
  return {
    matrix,
    defaultPalette,
    mapTokensToCssVars,
  };
}

export default useThemePalette;

