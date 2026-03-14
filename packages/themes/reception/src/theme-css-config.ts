/**
 * Reception Theme CSS Config
 *
 * Maps structured token values to the CSS compiler for the reception app.
 * Uses `tokenVarMap` (not `colorVarMap`) because reception tokens come from
 * a flat TokenMap, not from assets.brandColors.
 *
 * Dark mode strategy:
 * - All 72 semantic + 70 shade CSS vars are declared in :root (light values
 *   + -dark-suffixed siblings).
 * - `darkSelector: "html.theme-dark"` emits the dark swap block.
 * - The generate script also emits @media (prefers-color-scheme: dark) :root
 *   by post-processing the html.theme-dark block.
 *
 * Shade tokens (names containing "Shades") are stored as full hsl() strings
 * to avoid Tailwind v4 cascade issues. Semantic tokens remain bare HSL
 * triplets (consumed via hsl(var(...)) in the Tailwind config).
 *
 * The generated CSS is a known superset of tokens.css: it also includes
 * `color-scheme: light/dark` and `--theme-transition-duration: 200ms`
 * (both emitted by the compiler automatically from the profile).
 */
/* eslint-disable ds/no-raw-color -- theme config IS the color source of truth */
import type { ThemeCSSConfig } from "@themes/base";

import { assets } from "./assets";
import { profile } from "./design-profile";

/** Whether a var name refers to a shade token (bar/POS product grid colours). */
function isShadeVar(varName: string): boolean {
  return varName.includes("Shades");
}

/** Wrap an HSL triplet string as a full hsl() value. */
function hsl(triplet: string): string {
  return `hsl(${triplet})`;
}

export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,

  // Reception has no font assets, brand colors, or RGB triplets in assets.ts.
  colorVarMap: {},
  fontVarMap: {},

  darkSelector: "html.theme-dark",

  /**
   * All reception token vars.
   *
   * Each semantic token is stored twice:
   *   1. The base var: { light: <bare HSL triplet>, dark: "var(--varname-dark)" }
   *      The dark value swaps to the -dark sibling in the html.theme-dark block.
   *   2. The -dark sibling: { light: <bare HSL triplet> }
   *      The sibling stays in :root so consumers like globals.css runtime aliases
   *      can reference e.g. hsl(var(--color-bg-dark)) directly.
   *
   * Shade tokens follow the same pattern but use full hsl() strings
   * (not bare triplets) to avoid the Tailwind v4 cascade issue:
   * https://github.com/tailwindlabs/tailwindcss/issues/... (see CLAUDE.md)
   */
  tokenVarMap: {
    // ── Brand / action ─────────────────────────────────────────────────────
    "--color-primary": { light: "142 72% 30%", dark: "var(--color-primary-dark)" },
    "--color-primary-dark": { light: "142 55% 48%" },
    "--color-primary-fg": { light: "0 0% 100%", dark: "var(--color-primary-fg-dark)" },
    "--color-primary-fg-dark": { light: "160 8% 4%" },
    "--color-primary-soft": { light: "142 60% 95%", dark: "var(--color-primary-soft-dark)" },
    "--color-primary-soft-dark": { light: "142 50% 14%" },
    "--color-primary-hover": { light: "142 72% 25%", dark: "var(--color-primary-hover-dark)" },
    "--color-primary-hover-dark": { light: "142 55% 54%" },
    "--color-primary-active": { light: "142 72% 20%", dark: "var(--color-primary-active-dark)" },
    "--color-primary-active-dark": { light: "142 55% 58%" },

    "--color-accent": { light: "36 90% 50%", dark: "var(--color-accent-dark)" },
    "--color-accent-dark": { light: "36 85% 58%" },
    "--color-accent-fg": { light: "0 0% 10%", dark: "var(--color-accent-fg-dark)" },
    "--color-accent-fg-dark": { light: "0 0% 10%" },
    "--color-accent-soft": { light: "36 80% 95%", dark: "var(--color-accent-soft-dark)" },
    "--color-accent-soft-dark": { light: "36 60% 16%" },

    // ── Surfaces ────────────────────────────────────────────────────────────
    "--surface-1": { light: "0 0% 100%", dark: "var(--surface-1-dark)" },
    "--surface-1-dark": { light: "160 8% 4%" },
    "--surface-2": { light: "150 4% 96%", dark: "var(--surface-2-dark)" },
    "--surface-2-dark": { light: "160 8% 8%" },
    "--surface-3": { light: "150 4% 92%", dark: "var(--surface-3-dark)" },
    "--surface-3-dark": { light: "160 6% 12%" },
    "--surface-input": { light: "150 4% 97%", dark: "var(--surface-input-dark)" },
    "--surface-input-dark": { light: "160 6% 10%" },

    "--color-bg": { light: "0 0% 100%", dark: "var(--color-bg-dark)" },
    "--color-bg-dark": { light: "160 8% 4%" },
    "--color-fg": { light: "0 0% 10%", dark: "var(--color-fg-dark)" },
    "--color-fg-dark": { light: "150 10% 92%" },
    "--color-fg-muted": { light: "0 0% 40%", dark: "var(--color-fg-muted-dark)" },
    "--color-fg-muted-dark": { light: "150 5% 65%" },

    "--color-panel": { light: "150 4% 97%", dark: "var(--color-panel-dark)" },
    "--color-panel-dark": { light: "160 6% 10%" },
    "--color-inset": { light: "150 4% 98%", dark: "var(--color-inset-dark)" },
    "--color-inset-dark": { light: "160 8% 6%" },

    // ── Borders ─────────────────────────────────────────────────────────────
    "--color-border": { light: "0 0% 80%", dark: "var(--color-border-dark)" },
    "--color-border-dark": { light: "150 6% 22%" },
    "--color-border-strong": { light: "0 0% 65%", dark: "var(--color-border-strong-dark)" },
    "--color-border-strong-dark": { light: "150 6% 35%" },
    "--color-border-muted": { light: "0 0% 88%", dark: "var(--color-border-muted-dark)" },
    "--color-border-muted-dark": { light: "150 5% 16%" },

    // ── Focus / ring / link ─────────────────────────────────────────────────
    "--color-focus-ring": { light: "142 72% 30%", dark: "var(--color-focus-ring-dark)" },
    "--color-focus-ring-dark": { light: "142 70% 48%" },
    "--ring": { light: "142 72% 30%", dark: "var(--ring-dark)" },
    "--ring-dark": { light: "142 70% 48%" },
    "--color-link": { light: "142 60% 28%", dark: "var(--color-link-dark)" },
    "--color-link-dark": { light: "142 65% 60%" },

    // ── Muted neutrals ───────────────────────────────────────────────────────
    "--color-muted": { light: "150 4% 88%", dark: "var(--color-muted-dark)" },
    "--color-muted-dark": { light: "150 5% 24%" },
    "--color-muted-fg": { light: "0 0% 20%", dark: "var(--color-muted-fg-dark)" },
    "--color-muted-fg-dark": { light: "150 5% 85%" },

    // ── Typography ──────────────────────────────────────────────────────────
    // Font vars have no dark variant — light-only entries.
    "--font-sans": { light: "var(--font-inter)" },
    "--font-mono": { light: "var(--font-jetbrains-mono)" },

    // ── Interaction depth ────────────────────────────────────────────────────
    "--color-table-row-hover": { light: "150 8% 96%", dark: "var(--color-table-row-hover-dark)" },
    "--color-table-row-hover-dark": { light: "160 12% 12%" },
    "--color-table-row-alt": { light: "150 6% 91%", dark: "var(--color-table-row-alt-dark)" },
    "--color-table-row-alt-dark": { light: "160 10% 14%" },
    "--color-surface-elevated": { light: "150 10% 94%", dark: "var(--color-surface-elevated-dark)" },
    "--color-surface-elevated-dark": { light: "160 10% 14%" },

    // ── Shade families (bar/POS product grid) ────────────────────────────────
    // These use full hsl() strings (not bare triplets) to satisfy the
    // Tailwind v4 cascade fix. The tailwind.config.mjs shade bridge entries
    // use var(--color-*) (no hsl(var(...)) wrapper) after TASK-05.

    "--color-pinkShades-row1": { light: hsl("330 55% 66%"), dark: "var(--color-pinkShades-row1-dark)" },
    "--color-pinkShades-row1-dark": { light: hsl("330 25% 22%") },
    "--color-pinkShades-row2": { light: hsl("330 55% 60%"), dark: "var(--color-pinkShades-row2-dark)" },
    "--color-pinkShades-row2-dark": { light: hsl("330 25% 26%") },
    "--color-pinkShades-row3": { light: hsl("330 50% 54%"), dark: "var(--color-pinkShades-row3-dark)" },
    "--color-pinkShades-row3-dark": { light: hsl("330 22% 30%") },
    "--color-pinkShades-row4": { light: hsl("330 45% 48%"), dark: "var(--color-pinkShades-row4-dark)" },
    "--color-pinkShades-row4-dark": { light: hsl("330 20% 34%") },

    "--color-coffeeShades-row1": { light: hsl("25 40% 60%"), dark: "var(--color-coffeeShades-row1-dark)" },
    "--color-coffeeShades-row1-dark": { light: hsl("25 22% 22%") },
    "--color-coffeeShades-row2": { light: hsl("25 40% 52%"), dark: "var(--color-coffeeShades-row2-dark)" },
    "--color-coffeeShades-row2-dark": { light: hsl("25 22% 28%") },
    "--color-coffeeShades-row3": { light: hsl("25 35% 44%"), dark: "var(--color-coffeeShades-row3-dark)" },
    "--color-coffeeShades-row3-dark": { light: hsl("25 20% 34%") },

    "--color-beerShades-row1": { light: hsl("42 65% 50%"), dark: "var(--color-beerShades-row1-dark)" },
    "--color-beerShades-row1-dark": { light: hsl("42 30% 22%") },
    "--color-beerShades-row2": { light: hsl("42 60% 42%"), dark: "var(--color-beerShades-row2-dark)" },
    "--color-beerShades-row2-dark": { light: hsl("42 28% 28%") },

    "--color-wineShades-row1": { light: hsl("350 45% 43%"), dark: "var(--color-wineShades-row1-dark)" },
    "--color-wineShades-row1-dark": { light: hsl("350 25% 24%") },
    "--color-wineShades-row2": { light: hsl("350 40% 34%"), dark: "var(--color-wineShades-row2-dark)" },
    "--color-wineShades-row2-dark": { light: hsl("350 22% 30%") },
    "--color-wineShades-row3": { light: hsl("350 35% 26%"), dark: "var(--color-wineShades-row3-dark)" },
    "--color-wineShades-row3-dark": { light: hsl("350 20% 36%") },

    "--color-teaShades-row1": { light: hsl("80 40% 60%"), dark: "var(--color-teaShades-row1-dark)" },
    "--color-teaShades-row1-dark": { light: hsl("80 22% 22%") },
    "--color-teaShades-row2": { light: hsl("80 38% 52%"), dark: "var(--color-teaShades-row2-dark)" },
    "--color-teaShades-row2-dark": { light: hsl("80 20% 28%") },

    "--color-greenShades-row1": { light: hsl("140 40% 60%"), dark: "var(--color-greenShades-row1-dark)" },
    "--color-greenShades-row1-dark": { light: hsl("140 22% 22%") },
    "--color-greenShades-row2": { light: hsl("140 38% 52%"), dark: "var(--color-greenShades-row2-dark)" },
    "--color-greenShades-row2-dark": { light: hsl("140 20% 26%") },
    "--color-greenShades-row3": { light: hsl("140 35% 44%"), dark: "var(--color-greenShades-row3-dark)" },
    "--color-greenShades-row3-dark": { light: hsl("140 18% 30%") },

    "--color-warmGreenShades-row1": { light: hsl("110 46% 58%"), dark: "var(--color-warmGreenShades-row1-dark)" },
    "--color-warmGreenShades-row1-dark": { light: hsl("110 22% 22%") },
    "--color-warmGreenShades-row2": { light: hsl("110 44% 50%"), dark: "var(--color-warmGreenShades-row2-dark)" },
    "--color-warmGreenShades-row2-dark": { light: hsl("110 20% 27%") },
    "--color-warmGreenShades-row3": { light: hsl("110 41% 42%"), dark: "var(--color-warmGreenShades-row3-dark)" },
    "--color-warmGreenShades-row3-dark": { light: hsl("110 18% 32%") },
    "--color-warmGreenShades-row4": { light: hsl("110 38% 34%"), dark: "var(--color-warmGreenShades-row4-dark)" },
    "--color-warmGreenShades-row4-dark": { light: hsl("110 16% 37%") },
    "--color-warmGreenShades-row5": { light: hsl("110 35% 27%"), dark: "var(--color-warmGreenShades-row5-dark)" },
    "--color-warmGreenShades-row5-dark": { light: hsl("110 14% 42%") },

    "--color-purpleShades-row1": { light: hsl("270 40% 56%"), dark: "var(--color-purpleShades-row1-dark)" },
    "--color-purpleShades-row1-dark": { light: hsl("270 22% 24%") },
    "--color-purpleShades-row2": { light: hsl("270 38% 48%"), dark: "var(--color-purpleShades-row2-dark)" },
    "--color-purpleShades-row2-dark": { light: hsl("270 20% 30%") },

    "--color-spritzShades-row1": { light: hsl("20 70% 53%"), dark: "var(--color-spritzShades-row1-dark)" },
    "--color-spritzShades-row1-dark": { light: hsl("20 30% 24%") },
    "--color-spritzShades-row2": { light: hsl("20 65% 45%"), dark: "var(--color-spritzShades-row2-dark)" },
    "--color-spritzShades-row2-dark": { light: hsl("20 28% 30%") },

    "--color-orangeShades-row1": { light: hsl("30 65% 60%"), dark: "var(--color-orangeShades-row1-dark)" },
    "--color-orangeShades-row1-dark": { light: hsl("30 28% 22%") },
    "--color-orangeShades-row2": { light: hsl("30 60% 54%"), dark: "var(--color-orangeShades-row2-dark)" },
    "--color-orangeShades-row2-dark": { light: hsl("30 26% 26%") },
    "--color-orangeShades-row3": { light: hsl("30 55% 48%"), dark: "var(--color-orangeShades-row3-dark)" },
    "--color-orangeShades-row3-dark": { light: hsl("30 24% 30%") },
    "--color-orangeShades-row4": { light: hsl("30 50% 42%"), dark: "var(--color-orangeShades-row4-dark)" },
    "--color-orangeShades-row4-dark": { light: hsl("30 22% 34%") },
    "--color-orangeShades-row5": { light: hsl("30 45% 36%"), dark: "var(--color-orangeShades-row5-dark)" },
    "--color-orangeShades-row5-dark": { light: hsl("30 20% 38%") },

    "--color-grayishShades-row1": { light: hsl("220 10% 60%"), dark: "var(--color-grayishShades-row1-dark)" },
    "--color-grayishShades-row1-dark": { light: hsl("220 6% 22%") },
    "--color-grayishShades-row2": { light: hsl("220 8% 52%"), dark: "var(--color-grayishShades-row2-dark)" },
    "--color-grayishShades-row2-dark": { light: hsl("220 5% 28%") },
    "--color-grayishShades-row3": { light: hsl("220 6% 44%"), dark: "var(--color-grayishShades-row3-dark)" },
    "--color-grayishShades-row3-dark": { light: hsl("220 4% 34%") },
    "--color-grayishShades-row4": { light: hsl("220 5% 36%"), dark: "var(--color-grayishShades-row4-dark)" },
    "--color-grayishShades-row4-dark": { light: hsl("220 3% 40%") },

    // ── Chart palette ────────────────────────────────────────────────────────
    "--chart-1": { light: "44 85% 48%", dark: "var(--chart-1-dark)" },
    "--chart-1-dark": { light: "44 85% 65%" },
    "--chart-2": { light: "142 71% 45%", dark: "var(--chart-2-dark)" },
    "--chart-2-dark": { light: "142 71% 60%" },
    "--chart-3": { light: "25 95% 53%", dark: "var(--chart-3-dark)" },
    "--chart-3-dark": { light: "25 95% 68%" },
    "--chart-4": { light: "347 77% 50%", dark: "var(--chart-4-dark)" },
    "--chart-4-dark": { light: "347 77% 65%" },
    "--chart-5": { light: "174 71% 39%", dark: "var(--chart-5-dark)" },
    "--chart-5-dark": { light: "174 71% 60%" },
    "--chart-6": { light: "60 80% 44%", dark: "var(--chart-6-dark)" },
    "--chart-6-dark": { light: "60 80% 62%" },
    "--chart-7": { light: "160 84% 39%", dark: "var(--chart-7-dark)" },
    "--chart-7-dark": { light: "160 84% 55%" },
  },
};

// Export helpers for tests that need to classify token types
export { isShadeVar };
