/* eslint-disable ds/no-raw-color, ds/no-raw-font */
import type { ThemeAssets } from "@themes/base";

/**
 * Brikette brand assets.
 * Positano-inspired hostel — Franklin Gothic ATF headings,
 * Poppins body, Mediterranean gradient system, brand-colored shadows.
 *
 * Extracted from:
 * - apps/brikette/src/styles/global.css  (brand colors, gradients)
 * - apps/brikette/src/styles/fonts.css   (font-face declarations)
 * - apps/brikette/tailwind.config.mjs    (keyframes, shadows)
 */
export const assets: ThemeAssets = {
  fonts: {
    heading: {
      family: '"Franklin Gothic ATF", "Poppins", ui-sans-serif',
      source: "local",
      weights: [400, 700],
    },
    body: {
      family: '"Poppins", ui-sans-serif, system-ui, sans-serif',
      source: "local",
      variableFont: true,
      weights: [100, 900],
    },
    display: {
      family: '"Libre Franklin", ui-sans-serif, system-ui, sans-serif',
      source: "local",
      weights: [400],
    },
  },

  gradients: {
    hero: {
      type: "linear",
      angle: 135,
      stops: [
        { color: "var(--color-brand-gradient-start)", position: "0%" },
        { color: "var(--color-brand-primary)", position: "100%" },
      ],
    },
    header: {
      type: "linear",
      angle: 180,
      stops: [
        { color: "var(--color-brand-gradient-start)", position: "0%" },
        { color: "var(--color-brand-gradient-mid)", position: "40%" },
        { color: "var(--color-brand-gradient-end)", position: "100%" },
      ],
    },
  },

  shadows: {
    brandPrimary10: "0 8px 20px rgba(var(--rgb-brand-primary), 0.10)",
    brandPrimary40: "0 10px 24px rgba(var(--rgb-brand-primary), 0.40)",
    textSm: "0 1px 2px rgba(0,0,0,0.25)",
  },

  keyframes: {
    "fade-up": {
      from: { opacity: "0", transform: "translateY(0.5rem)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
    "slide-down": {
      from: { opacity: "0", transform: "translateY(-10%)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
    "fade-in": {
      from: { opacity: "0" },
      to: { opacity: "1" },
    },
    "fade-out": {
      from: { opacity: "1" },
      to: { opacity: "0" },
    },
    "zoom-in-95": {
      from: { opacity: "0", transform: "scale(0.95)" },
      to: { opacity: "1", transform: "scale(1)" },
    },
    "zoom-out-95": {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(0.95)" },
    },
  },

  brandColors: {
    // Core brand palette — light/dark adaptive
    primary: { light: "#005887", dark: "#4da8d4" },
    secondary: { light: "#f4d35e", dark: "#d2b53f" },
    terra: { light: "#c4572e", dark: "#ff5722" },
    bougainvillea: { light: "#9b1b33", dark: "#e85070" },

    // Surface colors — light/dark adaptive
    bg: { light: "#ffffff", dark: "#181818" },
    surface: { light: "#f2f3f4", dark: "#1f1f1f" },
    text: { light: "#1b1b1b", dark: "#f7f7f7" },
    heading: { light: "#1b1b1b", dark: "#ffffff" },
    onPrimary: { light: "#ffffff", dark: "#1b1b1b" },
    onAccent: { light: "#1b1b1b", dark: "#1b1b1b" },

    // Gradient stops — light/dark adaptive
    gradientStart: { light: "#003d73", dark: "#000000" },
    gradientMid: { light: "#005c9c", dark: "#1b1b1b" },
    gradientEnd: { light: "#005887", dark: "#2b2b2b" },

    // Partner brand accents (static — no dark variant)
    ratingHostelworld: "#ff6a00",
    ratingBooking: "#003580",

    // Header elements
    headerLink: "#ffffff",
    headerLogoText: "#f7f7f7",
  },
};
