import type { ThemeAssets } from "@themes/base";

/**
 * BCD theme assets.
 * CMS utility theme — vibrant pink/gold palette with hero gradients.
 * Uses Geist Sans via base. No custom font assets.
 */
export const assets: ThemeAssets = {
  fonts: {},

  gradients: {
    hero: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "hsl(234 89% 60%)", position: "0%" },
        { color: "hsl(270 83% 60%)", position: "50%" },
        { color: "hsl(222 47% 11%)", position: "100%" },
      ],
    },
  },

  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },

  keyframes: {},

  brandColors: {
    primary: { light: "hsl(340 80% 50%)" },
    accent: { light: "hsl(40 95% 50%)" },
  },
};
