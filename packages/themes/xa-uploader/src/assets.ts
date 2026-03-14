/* eslint-disable ds/no-raw-color -- theme config IS the color source of truth */
import type { ThemeAssets } from "@themes/base";

/**
 * xa-uploader brand assets.
 * Gate — inventory management operations tool.
 * Minimal palette: dark header, teal accent, white background, status colors.
 *
 * Extracted from: apps/xa-uploader/src/app/globals.css (:root block)
 */
export const assets: ThemeAssets = {
  fonts: {},
  gradients: {},
  shadows: {},
  keyframes: {},

  brandColors: {
    // Core surface and text
    ink: "hsl(0 0% 10%)",
    muted: "hsl(0 0% 40%)",
    bg: "hsl(0 0% 100%)",
    surface: "hsl(0 0% 96%)",
    inputBg: "hsl(0 0% 100%)",

    // Accent
    accent: "hsl(190 70% 40%)",
    accentSoft: "hsl(190 50% 95%)",
    onAccent: "hsl(0 0% 100%)",

    // Header
    headerBg: "hsl(220 20% 10%)",
    headerFg: "hsl(0 0% 92%)",
    headerMuted: "hsl(0 0% 60%)",

    // Status indicators
    statusReady: "hsl(150 60% 40%)",
    statusDraft: "hsl(40 90% 50%)",
    statusIncomplete: "hsl(0 75% 55%)",
  },
};
