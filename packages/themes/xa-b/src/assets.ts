/* eslint-disable ds/no-raw-color */
import type { ThemeAssets } from "@themes/base";

/**
 * XA-B brand assets.
 * Achromatic cyber-atelier aesthetic — Work Sans body, IBM Plex Mono code,
 * 16 swatch hex colors for product filtering, 3 chromatic FAB accent tokens.
 *
 * Extracted from:
 * - apps/xa-b/src/app/globals.css       (swatch hex colors)
 * - apps/xa-b/src/app/xa-cyber-atelier.css (fonts, FAB colors)
 */
export const assets: ThemeAssets = {
  fonts: {
    body: {
      family: 'var(--font-atelier-sans, "Work Sans", "Helvetica Neue", Arial, sans-serif)',
      source: "local",
      weights: [400, 500, 600],
    },
    mono: {
      family: 'var(--font-atelier-mono, "IBM Plex Mono", ui-monospace, monospace)',
      source: "local",
      weights: [400],
    },
  },

  gradients: {},
  shadows: {},
  keyframes: {},

  brandColors: {
    // Product swatch palette (static hex — no dark variants)
    xaSwatchBlack: "#0f0f0f",
    xaSwatchIvory: "#f3f0e8",
    xaSwatchCream: "#f4efe4",
    xaSwatchCamel: "#b88963",
    xaSwatchBrown: "#7c5a41",
    xaSwatchNavy: "#1f2a44",
    xaSwatchGold: "#d3b26a",
    xaSwatchGraphite: "#3b3f46",
    xaSwatchTan: "#c08a58",
    xaSwatchCharcoal: "#2b2d31",
    xaSwatchBone: "#efe9dd",
    xaSwatchSilver: "#c9c9c9",
    xaSwatchIndigo: "#2d3c5a",
    xaSwatchWhite: "#ffffff",
    xaSwatchFallback: "#e5e5e5",
    xaSwatchFilterFallback: "#f5f5f5",

    // Support dock FAB — chromatic accent with light/dark variants (HSL triplets)
    xaFabBg: { light: "158 18% 30%", dark: "158 14% 68%" },
    xaFabFg: { light: "0 0% 100%", dark: "0 0% 8%" },
    xaFabHover: { light: "158 18% 24%", dark: "158 14% 74%" },
  },
};
