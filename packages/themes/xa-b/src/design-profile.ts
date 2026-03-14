import type { DesignProfile } from "@themes/base";

/**
 * XA-B design profile — achromatic minimal character.
 * Monochromatic strategy, sharp radii, flat elevation, precise motion.
 *
 * Extracted from:
 * - apps/xa-b/src/app/xa-cyber-atelier.css (radii, elevations, transitions)
 * - Component usage patterns across the app
 */
export const profile: DesignProfile = {
  // ═══════════════════════════════════════════
  // Category A: compile-time variables
  // ═══════════════════════════════════════════

  typography: {
    scaleRatio: 1.2,
    bodySize: "1rem",
    bodyLeading: 1.6,
    bodyMeasure: "65ch",
    displayWeight: 600,
    labelTracking: "0.18em",
  },

  motion: {
    durationFast: "120ms",
    durationNormal: "180ms",
    durationSlow: "300ms",
    easing: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  },

  space: {
    sectionGap: "var(--space-12, 3rem)",
    componentGap: "var(--space-4, 1rem)",
    contentMaxWidth: "var(--size-5xl, 64rem)",
    cardPadding: "var(--space-6, 1.5rem)",
  },

  // ═══════════════════════════════════════════
  // Category B: enum-to-token mappings
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // Category C: agent-only guidance
  // ═══════════════════════════════════════════

  guidance: {
    colorStrategy: "monochromatic",
    accentUsage: "spot",
    whitespace: "generous",
    gridCharacter: "asymmetric",
    imageRelationship: "contained",
    motionPersonality: "precise",
    displayTransform: "uppercase",
  },
};
