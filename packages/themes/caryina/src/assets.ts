/* eslint-disable ds/no-raw-color, ds/no-raw-font */
import type { ThemeAssets } from "@themes/base";

/**
 * Caryina brand assets.
 * Premium handbag accessories — Cormorant Garamond headings,
 * restrained pastel palette, editorial character.
 */
export const assets: ThemeAssets = {
  fonts: {
    heading: {
      family: '"Cormorant Garamond", "Georgia", serif',
      source: "google",
      weights: [300, 400, 500, 600, 700],
    },
    body: {
      family: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      source: "google",
      weights: [400, 500, 700],
    },
  },

  // Restrained brand — no gradients
  gradients: {},

  shadows: {},

  // No keyframes initially
  keyframes: {},

  brandColors: {
    strawberryMilk: { light: "hsl(355 55% 75%)", dark: "hsl(355 55% 75%)" },
    warmSage: { light: "hsl(130 18% 72%)", dark: "hsl(130 18% 62%)" },
    warmIvory: { light: "hsl(38 18% 98%)", dark: "hsl(355 14% 10%)" },
  },
};
