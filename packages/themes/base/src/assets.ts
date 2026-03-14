import type { ThemeAssets } from "./theme-expression";

/** Base theme has no brand assets. Themes override with brand-specific values. */
export const assets: ThemeAssets = {
  fonts: {},
  gradients: {},
  shadows: {},
  keyframes: {},
  brandColors: {},
};
