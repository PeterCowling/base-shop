/* eslint-disable ds/no-raw-color, ds/no-raw-font */
import type { ThemeAssets } from "@themes/base";

/**
 * Prime brand assets.
 * Guest-facing hospitality portal — warm coral/rose palette,
 * Plus Jakarta Sans typography, mobile-first lifestyle aesthetic.
 *
 * Extracted from:
 * - packages/themes/prime/src/tokens.ts  (brand colors, font reference)
 * - packages/themes/prime/tokens.css     (CSS custom properties)
 */
export const assets: ThemeAssets = {
  fonts: {
    body: {
      family: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      source: "google",
      weights: [400, 500, 600, 700],
    },
  },

  // No custom gradients — clean mobile aesthetic
  gradients: {},

  shadows: {},

  keyframes: {},

  brandColors: {
    // Warm coral primary — lifestyle/travel warmth
    primary: { light: "hsl(6 78% 47%)", dark: "hsl(6 72% 68%)" },
    primarySoft: { light: "hsl(6 65% 96%)", dark: "hsl(6 60% 18%)" },

    // Warm gold accent — complementary to coral
    accent: { light: "hsl(36 85% 55%)", dark: "hsl(36 80% 62%)" },
    accentSoft: { light: "hsl(36 80% 96%)", dark: "hsl(36 65% 20%)" },
  },
};
