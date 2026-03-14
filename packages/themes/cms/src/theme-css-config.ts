/**
 * CMS Theme CSS Config
 *
 * Maps all CMS design tokens to CSS custom properties via derivedVars.
 * The CMS has no brand hex colors — all tokens are semantic HSL triplets,
 * var() references, rgba() shadow strings, or px values.
 *
 * Dark mode uses html.theme-dark (not .dark) — set via darkSelector.
 *
 * Companion-var pattern:
 *   - *-dark suffixed vars declared in :root (in derivedVars.light)
 *   - html.theme-dark aliases them (in derivedVars.dark)
 */
import type { ThemeCSSConfig } from "@themes/base";

import { assets } from "./assets";
import { profile } from "./design-profile";

export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,

  // CMS has no brand hex colors — colorVarMap is unused.
  colorVarMap: {},

  // Font vars: --font-sans and --font-mono are generated via fontVarMap.
  // Remaining font-* vars (derivations) go in derivedVars.light below.
  fontVarMap: {
    sans: "font-sans",
    mono: "font-mono",
  },

  // No rgb triplets needed — CMS uses HSL triplets throughout.
  rgbVarMap: {},

  // Dark mode is toggled by adding .theme-dark to <html>.
  darkSelector: "html.theme-dark",

  derivedVars: {
    // ── :root block ──────────────────────────────────────────────────────
    // All 31 remaining :root custom properties (--font-sans and --font-mono
    // are produced by fontVarMap above).
    light: {
      // Semantic colours (light mode)
      "color-bg": "0 0% 100%",
      "color-fg": "0 0% 10%",
      "color-primary": "220 90% 56%",
      "color-primary-fg": "0 0% 100%",
      "color-accent": "260 83% 70%",
      "color-accent-fg": "0 0% 10%",
      "color-danger": "0 86% 97%",
      "color-danger-fg": "0 74% 42%",
      "color-success": "142 76% 97%",
      "color-success-fg": "142 72% 30%",
      "color-warning": "40 90% 96%",
      "color-warning-fg": "25 85% 31%",
      "color-info": "210 90% 96%",
      "color-info-fg": "210 90% 35%",
      "color-muted": "0 0% 88%",
      "color-link": "220 75% 40%",
      "color-muted-fg": "0 0% 20%",
      "color-muted-border": "0 0% 72%",

      // Dark companion vars (referenced by html.theme-dark rules)
      "color-bg-dark": "222 16% 10%",
      "color-fg-dark": "210 20% 92%",
      "color-primary-dark": "221 75% 62%",
      "color-primary-fg-dark": "0 0% 10%",
      "color-accent-dark": "276 62% 72%",
      "color-accent-fg-dark": "0 0% 10%",
      "color-danger-dark": "0 62% 48%",
      "color-danger-fg-dark": "0 0% 100%",
      "color-success-dark": "142 45% 32%",
      "color-success-fg-dark": "0 0% 100%",
      "color-warning-dark": "38 84% 52%",
      "color-warning-fg-dark": "0 0% 10%",
      "color-info-dark": "210 92% 56%",
      "color-info-fg-dark": "0 0% 10%",
      "color-muted-dark": "222 10% 28%",
      "color-muted-fg-dark": "0 0% 92%",
      "color-muted-border-dark": "0 0% 40%",

      // Hero tokens
      "hero-fg": "0 0% 100%",
      "hero-contrast-overlay": "0 0% 0% / 0.7",

      // Font derivations (var() references)
      "font-body": "var(--font-sans)",
      "font-heading-1": "var(--font-sans)",
      "font-heading-2": "var(--font-sans)",
      "typography-body-font-family": "var(--font-body)",
      "text-heading-1-font-family": "var(--font-heading-1)",
      "text-heading-2-font-family": "var(--font-heading-2)",

      // Layered surface tokens
      "surface-1": "var(--color-bg)",
      "surface-2": "0 0% 94%",
      "surface-3": "0 0% 92%",
      "surface-input": "0 0% 96%",

      // Focus ring dimensions
      "ring-width": "2px",
      "ring-offset-width": "2px",

      // Elevation scale (light mode)
      "elevation-0": "none",
      "elevation-1": "0 1px 2px rgba(0, 0, 0, 0.08)",
      "elevation-2": "0 2px 6px rgba(0, 0, 0, 0.12)",
      "elevation-3": "0 4px 12px rgba(0, 0, 0, 0.16)",
      "elevation-4": "0 8px 24px rgba(0, 0, 0, 0.20)",
      "elevation-5": "0 12px 36px rgba(0, 0, 0, 0.24)",

      // Border intensity tokens (alpha expressions)
      "border-1": "var(--color-fg) / 0.12",
      "border-2": "var(--color-fg) / 0.22",
      "border-3": "var(--color-fg) / 0.38",

      // Focus rings
      "ring": "var(--color-primary)",
      "ring-offset": "var(--surface-1)",

      // Gradient tokens
      "gradient-hero-from": "234 70% 55%",
      "gradient-hero-via": "272 60% 52%",
      "gradient-hero-to": "222 30% 18%",
    },

    // ── html.theme-dark block ─────────────────────────────────────────────
    // All 27 html.theme-dark custom properties.
    dark: {
      // Semantic colour aliases (redirect to companion vars declared in :root)
      "color-bg": "var(--color-bg-dark)",
      "color-fg": "var(--color-fg-dark)",
      "color-primary": "var(--color-primary-dark)",
      "color-primary-fg": "var(--color-primary-fg-dark)",
      "color-accent": "var(--color-accent-dark)",
      "color-accent-fg": "var(--color-accent-fg-dark)",
      "color-danger": "var(--color-danger-dark)",
      "color-danger-fg": "var(--color-danger-fg-dark)",
      "color-success": "var(--color-success-dark)",
      "color-success-fg": "var(--color-success-fg-dark)",
      "color-warning": "var(--color-warning-dark)",
      "color-warning-fg": "var(--color-warning-fg-dark)",
      "color-info": "var(--color-info-dark)",
      "color-info-fg": "var(--color-info-fg-dark)",
      "color-muted": "var(--color-muted-dark)",
      // color-link has no companion var — direct HSL override in dark mode
      "color-link": "220 80% 70%",
      "color-muted-fg": "var(--color-muted-fg-dark)",
      "color-muted-border": "var(--color-muted-border-dark)",

      // Hero tokens (same values as light mode)
      "hero-fg": "0 0% 100%",
      "hero-contrast-overlay": "0 0% 0% / 0.7",

      // Dark mode surfaces
      "surface-1": "var(--color-bg-dark)",
      "surface-2": "222 14% 13%",
      "surface-3": "222 12% 16%",

      // Focus rings (dark)
      "ring": "var(--color-primary-dark)",
      "ring-offset": "var(--surface-1)",

      // Dark inputs
      "surface-input": "222 12% 18%",
      "ring-width": "2px",
      "ring-offset-width": "2px",

      // Dark elevation scale
      "elevation-0": "none",
      "elevation-1": "0 1px 2px rgba(0, 0, 0, 0.14)",
      "elevation-2": "0 2px 6px rgba(0, 0, 0, 0.18)",
      "elevation-3": "0 4px 12px rgba(0, 0, 0, 0.24)",
      "elevation-4": "0 8px 24px rgba(0, 0, 0, 0.30)",
      "elevation-5": "0 12px 36px rgba(0, 0, 0, 0.36)",
    },
  },
};
