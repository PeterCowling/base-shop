import type { DesignProfile } from "@themes/base";

/**
 * Cover Me Pretty design profile — soft editorial cosmetics character.
 *
 * Clean, modern aesthetic with generous whitespace, restrained palette,
 * and a refined typography scale suited to beauty/cosmetics product pages.
 * Light-mode only. No surface mode overrides at this stage.
 */
export const profile: DesignProfile = {
  // ═══════════════════════════════════════════
  // Category A: compile-time variables
  // ═══════════════════════════════════════════

  typography: {
    scaleRatio: 1.25,
    bodySize: "1rem",
    bodyLeading: 1.6,
    bodyMeasure: "65ch",
    displayWeight: 600,
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
    contentMaxWidth: "var(--size-5xl, 64rem)",
    cardPadding: "var(--space-6, 1.5rem)",
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
    buttonTone: "solid",
    inputStyle: "outlined",
    tableStyle: "minimal",
  },

  // ═══════════════════════════════════════════
  // Category C: agent-only guidance
  // ═══════════════════════════════════════════

  guidance: {
    colorStrategy: "restrained",
    // rose-pink primary + sage accent — warm, restrained cosmetics palette

    accentUsage: "spot",
    // accent used on CTAs and highlights; primary on brand elements

    whitespace: "generous",
    // beauty/cosmetics benefits from breathing room; editorial feel

    gridCharacter: "single-column",
    // product-focused storefront; content flows vertically

    imageRelationship: "contained",
    // product images within rounded containers

    motionPersonality: "precise",
    // fade-in for content reveal; no bounce or spring

    displayTransform: "none",
    // sentence-case headings; elegant, not shouty
  },
};
