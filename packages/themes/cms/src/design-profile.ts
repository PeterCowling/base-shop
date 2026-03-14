import type { DesignProfile } from "@themes/base";

/**
 * CMS design profile — internal tool UI character.
 * Functional, restrained palette, focused on readability and information density.
 *
 * Extracted from:
 * - apps/cms/src/app/cms.tokens.css  (transition-duration: 250ms)
 * - apps/cms component usage patterns (outlined inputs, minimal tables)
 */
export const profile: DesignProfile = {
  // ═══════════════════════════════════════════
  // Category A: compile-time variables
  // ═══════════════════════════════════════════

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
    durationNormal: "250ms",       // --theme-transition-duration; matches cms.tokens.css transition-duration
    durationSlow: "400ms",
    easing: "ease",
  },

  space: {
    sectionGap: "var(--space-8, 2rem)",
    componentGap: "var(--space-4, 1rem)",
    contentMaxWidth: "var(--size-7xl, 80rem)",
    cardPadding: "var(--space-4, 1rem)",
  },

  // ═══════════════════════════════════════════
  // Category B: enum-to-token mappings
  // ═══════════════════════════════════════════

  surface: {
    defaultRadius: "md",
    defaultElevation: "subtle",
    defaultBorder: "subtle",
  },

  components: {
    buttonTone: "outline",
    inputStyle: "outlined",
    tableStyle: "minimal",
  },

  // ═══════════════════════════════════════════
  // Category C: agent-only guidance
  // ═══════════════════════════════════════════

  guidance: {
    colorStrategy: "restrained",
    accentUsage: "spot",
    whitespace: "balanced",
    gridCharacter: "asymmetric",
    imageRelationship: "contained",
    motionPersonality: "precise",
    displayTransform: "none",
  },
};
