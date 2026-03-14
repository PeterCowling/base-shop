import type { DesignProfile } from "@themes/base";

/**
 * Caryina design profile — editorial character.
 * Premium handbag accessories targeting women who own luxury brands.
 * Restrained palette, generous whitespace, serif headings.
 */
export const profile: DesignProfile = {
  // Category A
  typography: {
    scaleRatio: 1.333,
    bodySize: "1rem",
    bodyLeading: 1.6,
    bodyMeasure: "60ch",
    displayWeight: 400,
    labelTracking: "0.08em",
  },

  motion: {
    durationFast: "150ms",
    durationNormal: "250ms",
    durationSlow: "400ms",
    easing: "cubic-bezier(0.2, 0, 0, 1)",
  },

  space: {
    sectionGap: "var(--space-16, 4rem)",
    componentGap: "var(--space-6, 1.5rem)",
    contentMaxWidth: "var(--size-4xl, 56rem)",
    cardPadding: "var(--space-6, 1.5rem)",
  },

  // Category B
  surface: {
    defaultRadius: "sm",
    defaultElevation: "subtle",
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
    whitespace: "generous",
    gridCharacter: "single-column",
    imageRelationship: "contained",
    motionPersonality: "precise",
    displayTransform: "none",
  },

  modes: {
    editorial: {
      typography: { bodyMeasure: "58ch", scaleRatio: 1.414 },
      guidance: { whitespace: "extreme", gridCharacter: "single-column" },
    },
    marketing: {
      typography: { scaleRatio: 1.5, displayWeight: 300 },
      guidance: { whitespace: "extreme", imageRelationship: "full-bleed" },
    },
  },
};
