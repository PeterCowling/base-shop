import type { DesignProfile } from "@themes/base";

/**
 * Cochlearfit design profile — warm earth tones, healthcare-adjacent character.
 *
 * A healthcare-fitness app with a warm, approachable aesthetic.
 * Terracotta primary (#ef7048 equivalent via HSL 9 75% 59%),
 * muted sand and ocean accents, light-mode only, clean SPA character.
 */
export const profile: DesignProfile = {
  // ═══════════════════════════════════════════
  // Category A: compile-time variables
  // ═══════════════════════════════════════════

  typography: {
    scaleRatio: 1.25,
    bodySize: "1rem",
    bodyLeading: 1.6,
    bodyMeasure: "68ch",
    displayWeight: 700,
    labelTracking: "0.05em",
  },

  motion: {
    durationFast: "150ms",
    durationNormal: "200ms",
    durationSlow: "300ms",
    easing: "cubic-bezier(0.0, 0.0, 0.2, 1)",
  },

  space: {
    sectionGap: "var(--space-12, 3rem)",
    componentGap: "var(--space-4, 1rem)",
    contentMaxWidth: "var(--size-4xl, 56rem)",
    cardPadding: "var(--space-6, 1.5rem)",
  },

  // ═══════════════════════════════════════════
  // Category B: enum-to-token mappings
  // ═══════════════════════════════════════════

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

  // ═══════════════════════════════════════════
  // Category C: agent-only guidance
  // ═══════════════════════════════════════════

  guidance: {
    colorStrategy: "restrained",
    // terracotta primary + teal info + sand/ocean decorative — warm, restrained

    accentUsage: "spot",
    // terracotta used on CTAs and focus rings; teal on informational elements

    whitespace: "generous",
    // healthcare UX benefits from breathing room; avoid density

    gridCharacter: "single-column",
    // mobile-first SPA; content flows vertically

    imageRelationship: "contained",
    // images within rounded containers; not full-bleed

    motionPersonality: "precise",
    // fade-up and fade-in for content reveal; no bounce

    displayTransform: "none",
    // sentence-case headings; no uppercase convention
  },
};
