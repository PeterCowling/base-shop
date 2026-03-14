import type { DesignProfile } from "@themes/base";

/**
 * BCD design profile — CMS content management character.
 * Balanced defaults for editorial content creation and preview.
 */
export const profile: DesignProfile = {
  // Category A
  typography: {
    scaleRatio: 1.25,
    bodySize: "1rem",
    bodyLeading: 1.5,
    bodyMeasure: "65ch",
    displayWeight: 700,
    labelTracking: "0.05em",
  },

  motion: {
    durationFast: "150ms",
    durationNormal: "250ms",
    durationSlow: "400ms",
    easing: "cubic-bezier(0.2, 0, 0, 1)",
  },

  space: {
    sectionGap: "var(--space-8, 2rem)",
    componentGap: "var(--space-4, 1rem)",
    contentMaxWidth: "var(--size-5xl, 64rem)",
    cardPadding: "var(--space-6, 1.5rem)",
  },

  // Category B
  surface: {
    defaultRadius: "md",
    defaultElevation: "moderate",
    defaultBorder: "subtle",
  },

  components: {
    buttonTone: "solid",
    inputStyle: "outlined",
    tableStyle: "minimal",
  },

  // Category C
  guidance: {
    colorStrategy: "restrained",
    accentUsage: "spot",
    whitespace: "balanced",
    gridCharacter: "symmetric",
    imageRelationship: "contained",
    motionPersonality: "precise",
    displayTransform: "none",
  },
};
