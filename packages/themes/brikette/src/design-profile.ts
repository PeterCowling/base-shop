import type { DesignProfile } from "@themes/base";

/**
 * Brikette design profile — Mediterranean hospitality character.
 * Positano-inspired hostel targeting young female travelers.
 * Bold gradient system, warm palette, confident typography.
 *
 * Extracted from:
 * - apps/brikette/src/styles/global.css  (typography, transitions, spacing patterns)
 * - apps/brikette/tailwind.config.mjs    (animation timings)
 * - Component usage patterns across the app
 */
export const profile: DesignProfile = {
  // ═══════════════════════════════════════════
  // Category A: compile-time variables
  // ═══════════════════════════════════════════

  typography: {
    scaleRatio: 1.25,
    bodySize: "1rem",
    bodyLeading: 1.625,          // leading-relaxed (Tailwind default)
    bodyMeasure: "65ch",
    displayWeight: 700,          // headings use font-bold
    labelTracking: "0.3em",      // .tracking-eyebrow — distinctive wide tracking
  },

  motion: {
    durationFast: "150ms",       // fade-out: 150ms ease-in
    durationNormal: "200ms",     // --theme-transition-duration, fade-in: 200ms
    durationSlow: "300ms",       // fade-up: 300ms ease-out
    easing: "cubic-bezier(0.0, 0.0, 0.2, 1)", // ease-out (primary easing)
  },

  space: {
    sectionGap: "var(--space-12, 3rem)",         // clamp(3.5rem, 6vw, 5.5rem) main padding-block-end
    componentGap: "var(--space-4, 1rem)",
    contentMaxWidth: "var(--size-5xl, 64rem)",
    cardPadding: "var(--space-6, 1.5rem)",       // hero-panel p-6
  },

  // ═══════════════════════════════════════════
  // Category B: enum-to-token mappings
  // ═══════════════════════════════════════════

  surface: {
    defaultRadius: "xl",         // hero-panel uses rounded-2xl; cards use rounded-xl
    defaultElevation: "moderate", // shadow-xl on hero-panel; shadow-sm on CTAs
    defaultBorder: "none",       // ring-1 ring-white/20 for glass effect, not traditional borders
  },

  components: {
    buttonTone: "solid",         // cta-light/cta-dark are solid fills
    inputStyle: "outlined",
    tableStyle: "minimal",
  },

  // ═══════════════════════════════════════════
  // Category C: agent-only guidance
  // ═══════════════════════════════════════════

  guidance: {
    colorStrategy: "expressive",
    // primary (teal) + secondary (gold) + terra (terracotta) + bougainvillea (pink-red)
    // Four distinct brand colors = expressive palette

    accentUsage: "structural",
    // Gradients in header and hero sections; bougainvillea on hover states;
    // secondary on CTAs — accent is woven into key structural elements

    whitespace: "generous",
    // clamp(3.5rem, 6vw, 5.5rem) bottom padding; hero sections have substantial breathing room

    gridCharacter: "single-column",
    // Guides and content pages are single-column; marketing has constrained panels

    imageRelationship: "contained",
    // aspect-photo (4:3); images within rounded containers

    motionPersonality: "precise",
    // ease-out everywhere; no bounce/spring; fade-up for content reveal

    displayTransform: "uppercase",
    // .tracking-eyebrow (0.3em) and .tracking-kicker (0.2em) suggest uppercase label convention
  },

  // ═══════════════════════════════════════════
  // Surface modes
  // ═══════════════════════════════════════════

  modes: {
    marketing: {
      // Hero sections, landing pages, above-fold CTAs
      typography: { scaleRatio: 1.333, displayWeight: 700 },
      surface: { defaultRadius: "xl", defaultElevation: "layered" },
      guidance: { whitespace: "generous", imageRelationship: "full-bleed" },
    },
    editorial: {
      // Guides, content pages, FAQs
      typography: { bodyMeasure: "60ch", scaleRatio: 1.25 },
      space: { sectionGap: "var(--space-10, 2.5rem)" },
      guidance: { gridCharacter: "single-column", whitespace: "generous" },
    },
  },
};
