import type { ThemeCSSConfig } from "@themes/base";

import { assets } from "./assets.js";
import { profile } from "./design-profile.js";

/**
 * Cochlearfit theme CSS config.
 *
 * All 25 tokens are HSL triplets emitted verbatim via derivedVars.light.
 * No brand color hex values, font vars, or RGB triplets are needed.
 *
 * Values taken directly from apps/cochlearfit/src/app/globals.css.
 * Note: --color-link is "9 62% 48%" (literal HSL), not var(--color-accent).
 */
export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,
  colorVarMap: {},   // no hex brand colors
  fontVarMap: {},    // no font vars in :root
  rgbVarMap: {},     // no RGB triplets needed
  derivedVars: {
    light: {
      "color-bg":           "42 45% 94%",
      "color-fg":           "33 15% 12%",
      "color-fg-muted":     "33 11% 33%",
      "color-muted":        "40 30% 90%",
      "color-primary":      "9 75% 59%",
      "color-primary-fg":   "0 0% 100%",
      "color-accent":       "9 62% 48%",
      "color-accent-fg":    "0 0% 100%",
      "color-link":         "9 62% 48%",
      "color-info":         "178 51% 29%",
      "color-info-fg":      "0 0% 100%",
      "color-sand":         "38 52% 80%",
      "color-ocean":        "180 32% 46%",
      "color-berry":        "351 54% 60%",
      "surface-1":          "35 100% 98%",
      "surface-2":          "0 0% 100%",
      "surface-3":          "42 45% 92%",
      "surface-input":      "0 0% 100%",
      "color-panel":        "0 0% 100%",
      "color-focus-ring":   "var(--color-primary)",
      "ring":               "var(--color-primary)",
      "ring-offset":        "var(--color-bg)",
      "gradient-hero-from": "178 51% 29%",
      "gradient-hero-via":  "42 45% 94%",
      "gradient-hero-to":   "9 75% 59%",
    },
    // No dark block — cochlearfit is light-only.
    // The compiler will emit a .dark { color-scheme: dark; } block automatically;
    // this is harmless (no custom properties in it; no .dark class is applied).
  },
};
