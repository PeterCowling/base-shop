import type { DesignProfile } from "@themes/base";

/**
 * Prime design profile — friendly mobile-first character.
 * Guest-facing hospitality portal for young female travelers.
 * Warm, approachable, lifestyle-app aesthetic with Plus Jakarta Sans.
 *
 * Extracted from:
 * - packages/themes/prime/src/tokens.ts  (radius, font choices)
 * - apps/prime/src/styles/globals.css    (minimal — leans on shared UI)
 * - Component patterns across the app (chat, messaging, threads)
 */
export const profile: DesignProfile = {
  // Category A
  typography: {
    scaleRatio: 1.2,
    bodySize: "1rem",
    bodyLeading: 1.5,
    bodyMeasure: "65ch",
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
    sectionGap: "var(--space-8, 2rem)",
    componentGap: "var(--space-3, 0.75rem)",
    contentMaxWidth: "var(--size-lg, 32rem)",
    cardPadding: "var(--space-4, 1rem)",
  },

  // Category B
  surface: {
    defaultRadius: "lg",
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
    whitespace: "balanced",
    gridCharacter: "single-column",
    imageRelationship: "contained",
    motionPersonality: "precise",
    displayTransform: "none",
  },

  modes: {
    operations: {
      // Chat threads, message lists — compact, scan-friendly
      space: { sectionGap: "var(--space-4, 1rem)", cardPadding: "var(--space-3, 0.75rem)" },
      surface: { defaultElevation: "flat", defaultBorder: "defined" },
      guidance: { whitespace: "dense" },
    },
  },
};
