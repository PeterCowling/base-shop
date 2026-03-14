import type { ThemeAssets } from "@themes/base";

/**
 * CMS theme assets.
 * Tool UI — no brand colors (semantic tokens only, all HSL triplets).
 * Fonts: Geist Sans + Geist Mono (loaded by Next.js via next/font/google).
 *
 * Extracted from:
 * - apps/cms/src/app/cms.tokens.css  (font-family declarations)
 */
export const assets: ThemeAssets = {
  fonts: {
    sans: {
      family: "var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)",
      source: "local",
      weights: [400, 500, 600, 700],
    },
    mono: {
      family: "var(--font-geist-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
      source: "local",
      weights: [400, 500],
    },
  },

  gradients: {},

  shadows: {},

  keyframes: {},

  // CMS is a tool UI with no brand hex colors.
  // All semantic colors are declared as HSL triplets in derivedVars (theme-css-config.ts).
  brandColors: {},
};
