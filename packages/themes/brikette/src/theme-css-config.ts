/**
 * Brikette Theme CSS Config
 *
 * Maps structured asset/profile keys to the actual CSS variable names
 * consumed by the brikette app. This is the bridge between the
 * three-layer system and global.css.
 */
/* eslint-disable ds/no-raw-color -- theme config IS the color source of truth */
import type { ThemeCSSConfig } from "@themes/base";

import { assets } from "./assets";
import { profile } from "./design-profile";

export const themeCSSConfig: ThemeCSSConfig = {
  assets,
  profile,

  colorVarMap: {
    // Brand colors → --color-brand-*
    primary: "brand-primary",
    secondary: "brand-secondary",
    terra: "brand-terra",
    bougainvillea: "brand-bougainvillea",
    bg: "brand-bg",
    surface: "brand-surface",
    text: "brand-text",
    heading: "brand-heading",
    onPrimary: "brand-on-primary",
    onAccent: "brand-on-accent",

    // Gradients → --color-brand-gradient-*
    gradientStart: "brand-gradient-start",
    gradientMid: "brand-gradient-mid",
    // gradientEnd is derived: var(--color-brand-primary) — handled in derivedVars

    // Partner brand → --color-rating-*
    ratingHostelworld: "rating-hostelworld",
    ratingBooking: "rating-booking",

    // Header → --color-header-*
    headerLink: "header-link",
    headerLogoText: "header-logo-text",
  },

  fontVarMap: {
    body: "font-sans",
    heading: "font-heading",
  },

  rgbVarMap: {
    // Only these colors get RGB triplets in the current global.css
    bg: "rgb-brand-bg",
    surface: "rgb-brand-surface",
    text: "rgb-brand-text",
    heading: "rgb-brand-heading",
    primary: "rgb-brand-primary",
    secondary: "rgb-brand-secondary",
    terra: "rgb-brand-terra",
    bougainvillea: "rgb-brand-bougainvillea",
    onPrimary: "rgb-brand-on-primary",
    onAccent: "rgb-brand-on-accent",
  },

  derivedVars: {
    light: {
      // Gradient end aliases primary
      "color-brand-gradient-end": "var(--color-brand-primary)",
      // Outline aliases text in light mode
      "color-brand-outline": "var(--color-brand-text)",
      // UI layering
      "z-modal": "80",
      "layer-modal": "9999",
      "layer-modal-backdrop": "9998",
      // Header elements (static in both modes but declared in :root)
      // Hospitality semantics → base theme aliases
      "hospitality-ready": "var(--color-success)",
      "hospitality-ready-fg": "var(--color-success-fg)",
      "hospitality-warning": "var(--color-warning)",
      "hospitality-warning-fg": "var(--color-warning-fg)",
      "hospitality-info": "var(--color-info)",
      "hospitality-info-fg": "var(--color-info-fg)",
      // Design-system semantic token aliases (HSL triplets)
      "color-panel": "0 0% 100%",
      "color-bg": "0 0% 100%",
      "color-fg": "0 0% 11%",
      // RGB triplets for outline/muted/paragraph (not in brandColors)
      "rgb-brand-outline": "27 27 27",
      "rgb-brand-muted": "100 100 100",
      "rgb-brand-paragraph": "60 60 60",
    },
    dark: {
      // Gradient end in dark = different value
      "color-brand-gradient-end": "#2b2b2b",
      // Outline in dark needs explicit contrast value
      "color-brand-outline": "#626262",
      // Partner brand accents (same in dark)
      "color-rating-hostelworld": "#ff6a00",
      "color-rating-booking": "#003580",
      // Header elements
      "color-header-link": "#f7f7f7",
      "color-header-logo-text": "#ffffff",
      // UI layering (same in both modes)
      "layer-modal": "9999",
      "layer-modal-backdrop": "9998",
      // Hospitality semantics
      "hospitality-ready": "var(--color-success)",
      "hospitality-ready-fg": "var(--color-success-fg)",
      "hospitality-warning": "var(--color-warning)",
      "hospitality-warning-fg": "var(--color-warning-fg)",
      "hospitality-info": "var(--color-info)",
      "hospitality-info-fg": "var(--color-info-fg)",
      // DS semantic token aliases (dark mode)
      "color-panel": "0 0% 12%",
      "color-bg": "0 0% 9%",
      "color-fg": "0 0% 97%",
      // RGB triplets for outline/muted/paragraph (dark)
      "rgb-brand-outline": "98 98 98",
      "rgb-brand-muted": "180 180 180",
      "rgb-brand-paragraph": "210 210 210",
    },
  },
};
