import type { DesignProfile } from "@themes/base";

/**
 * Reception design profile — operational character.
 * Hospitality staff interface: dense, data-rich, clear hierarchy.
 * Green primary signals operational readiness.
 */
export const profile: DesignProfile = {
  // Category A
  typography: {
    scaleRatio: 1.2,
    bodySize: "0.875rem",
    bodyLeading: 1.5,
    bodyMeasure: "75ch",
    displayWeight: 600,
    labelTracking: "0.02em",
  },

  motion: {
    durationFast: "100ms",
    durationNormal: "200ms",
    durationSlow: "300ms",
    easing: "cubic-bezier(0.2, 0, 0, 1)",
  },

  space: {
    sectionGap: "var(--space-6, 1.5rem)",
    componentGap: "var(--space-3, 0.75rem)",
    contentMaxWidth: "var(--size-7xl, 80rem)",
    cardPadding: "var(--space-4, 1rem)",
  },

  // Category B
  surface: {
    defaultRadius: "md",
    defaultElevation: "subtle",
    defaultBorder: "defined",
  },

  components: {
    buttonTone: "solid",
    inputStyle: "outlined",
    tableStyle: "striped",
  },

  // Category C
  guidance: {
    colorStrategy: "restrained",
    accentUsage: "structural",
    whitespace: "dense",
    gridCharacter: "symmetric",
    imageRelationship: "contained",
    motionPersonality: "precise",
    displayTransform: "none",
  },

  modes: {
    operations: {
      space: { sectionGap: "var(--space-4, 1rem)", cardPadding: "var(--space-3, 0.75rem)" },
      surface: { defaultElevation: "flat", defaultBorder: "defined" },
      guidance: { whitespace: "dense", colorStrategy: "restrained" },
    },
  },
};
