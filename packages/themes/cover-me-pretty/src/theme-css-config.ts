/**
 * Cover Me Pretty Theme CSS Config
 *
 * Maps structured asset/profile keys to CSS variable names.
 * Uses tokenVarMap for the 20-token flat override surface
 * (HSL triplets for colors, pixel values for radii, font family strings).
 *
 * Light-mode only — no dark overrides. The compiler emits a minimal
 * .dark { color-scheme: dark; } block with no custom properties.
 *
 * TODO(operator): Confirm HSL triplet values match final brand palette.
 */
/* eslint-disable ds/no-raw-color -- theme config IS the color source of truth */
import type { ThemeCSSConfig } from "@themes/base";

import { assets } from "./assets";
import { profile } from "./design-profile";

export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,

  // Brand colors → --color-brand-* (hex-based from assets.brandColors)
  colorVarMap: {
    primary: "brand-primary",
    accent: "brand-accent",
  },

  fontVarMap: {
    body: "font-sans",
    heading: "font-heading",
  },

  // 20 semantic token overrides — HSL triplets + radii
  tokenVarMap: {
    // Background & foreground
    "--color-bg":             { light: "0 0% 99%" },
    "--color-fg":             { light: "340 10% 15%" },
    "--color-fg-muted":       { light: "340 6% 45%" },

    // Primary (rose-pink)
    "--color-primary":        { light: "350 72% 65%" },
    "--color-primary-fg":     { light: "0 0% 100%" },
    "--color-primary-soft":   { light: "350 50% 95%" },
    "--color-primary-hover":  { light: "350 72% 58%" },
    "--color-primary-active": { light: "350 72% 51%" },

    // Accent (sage green)
    "--color-accent":         { light: "120 16% 61%" },
    "--color-accent-fg":      { light: "120 20% 18%" },
    "--color-accent-soft":    { light: "120 12% 94%" },

    // Borders
    "--color-border":         { light: "340 10% 88%" },
    "--color-border-muted":   { light: "340 6% 93%" },
    "--color-border-strong":  { light: "340 12% 76%" },

    // Surface
    "--color-surface":        { light: "0 0% 100%" },

    // Radii
    "--radius-sm":            { light: "4px" },
    "--radius-md":            { light: "6px" },
    "--radius-lg":            { light: "10px" },
  },
};
