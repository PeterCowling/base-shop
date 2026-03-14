import type { DesignProfile } from "@themes/base";

/**
 * xa-uploader design profile — operations / inventory management tool.
 * Dense, functional, minimal motion. Gate theme.
 */
export const profile: DesignProfile = {
  typography: {
    scaleRatio: 1.2,
    bodySize: "0.875rem",
    bodyLeading: 1.5,
    bodyMeasure: "80ch",
    displayWeight: 600,
    labelTracking: "0em",
  },

  motion: {
    durationFast: "100ms",
    durationNormal: "150ms",   // stripped by postProcessGateCSS — not emitted to CSS
    durationSlow: "250ms",
    easing: "ease-in-out",
  },

  space: {
    sectionGap: "var(--space-6, 1.5rem)",
    componentGap: "var(--space-2, 0.5rem)",
    contentMaxWidth: "var(--size-6xl, 72rem)",
    cardPadding: "var(--space-4, 1rem)",
  },

  surface: {
    defaultRadius: "sm",
    defaultElevation: "flat",
    defaultBorder: "subtle",
  },

  components: {
    buttonTone: "solid",
    inputStyle: "outlined",
    tableStyle: "minimal",
  },

  guidance: {
    colorStrategy: "restrained",
    accentUsage: "spot",
    whitespace: "dense",
    gridCharacter: "symmetric",
    imageRelationship: "contained",
    motionPersonality: "precise",
    displayTransform: "none",
  },
};
