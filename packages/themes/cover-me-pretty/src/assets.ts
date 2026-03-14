/* eslint-disable ds/no-raw-color, ds/no-raw-font */
import type { ThemeAssets } from "@themes/base";

/**
 * Cover Me Pretty brand assets — cosmetics/beauty character.
 *
 * Rose-pink primary, soft sage accent. Light-mode only.
 * No gradients, shadows, or keyframes at this stage.
 *
 * TODO(operator): Confirm brand hex values before campaign launch.
 * Current values are cosmetics-appropriate placeholders.
 */
export const assets: ThemeAssets = {
  fonts: {
    body: {
      family: '"Geist", ui-sans-serif, system-ui, sans-serif',
      source: "local",
      variableFont: true,
      weights: [100, 900],
    },
    heading: {
      family: '"Geist", ui-sans-serif, system-ui, sans-serif',
      source: "local",
      variableFont: true,
      weights: [100, 900],
    },
  },

  gradients: {},
  shadows: {},
  keyframes: {},

  brandColors: {
    // TODO(operator): Confirm brand hex values — these are cosmetics-appropriate placeholders.
    primary: "#e8637a",       // rose-pink
    accent: "#8fad8a",        // soft sage green
  },
};
