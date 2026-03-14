import type { ThemeAssets } from "@themes/base";

/**
 * Dark theme assets.
 * CMS dark-mode variant — elevated surface hierarchy with
 * blue primary and purple accent on dark backgrounds.
 */
export const assets: ThemeAssets = {
  fonts: {},
  gradients: {
    hero: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "hsl(234 70% 55%)", position: "0%" },
        { color: "hsl(272 60% 52%)", position: "50%" },
        { color: "hsl(222 30% 18%)", position: "100%" },
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
    primary: { light: "hsl(220 90% 66%)", dark: "hsl(220 90% 66%)" },
    accent: { light: "hsl(260 83% 15%)", dark: "hsl(260 83% 15%)" },
  },
};
