/* eslint-disable ds/no-raw-tailwind-color */
import type { ThemeRecipes } from "@themes/base";

/**
 * Brikette recipes — branded surface compositions.
 *
 * Extracted from:
 * - apps/brikette/src/styles/global.css (@layer components and @layer utilities)
 *
 * These recipes formalize existing CSS classes in the three-layer schema.
 * The original classes remain in global.css — this file provides structured
 * metadata for agent consumption and future CSS generation.
 */
export const recipes: ThemeRecipes = {
  heroPanel: {
    description:
      "Primary hero surface with brand gradient, backdrop blur, and subtle glass ring. The signature Brikette marketing composition.",
    applicableModes: ["marketing", "campaign"],
    base: {
      classes:
        "rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl ring-1 ring-white/20",
      css: {
        backgroundImage:
          "linear-gradient(135deg, var(--color-brand-gradient-start) 0%, var(--color-brand-primary) 100%)",
        opacity: "0.96",
        transition:
          "opacity var(--theme-transition-duration) ease, color var(--theme-transition-duration) ease, background-color var(--theme-transition-duration) ease",
      },
    },
    variants: {
      dark: {
        css: { opacity: "1" },
      },
      compact: {
        classes:
          "rounded-xl p-4 md:p-6 backdrop-blur-sm shadow-xl ring-1 ring-white/20",
        css: {
          backgroundImage:
            "linear-gradient(135deg, var(--color-brand-gradient-start) 0%, var(--color-brand-primary) 100%)",
          opacity: "0.96",
        },
      },
    },
    usage:
      "Full-width hero sections, above-fold CTAs, marketing landing panels",
    doNotUseWhen:
      "Content-heavy pages where the gradient competes with readability; editorial surfaces",
  },

  ctaLight: {
    description:
      "Secondary CTA pill with brand-secondary (gold) background. Used for warm, inviting calls-to-action on dark or gradient backgrounds.",
    applicableModes: ["marketing", "campaign"],
    base: {
      classes:
        "inline-block min-w-0 rounded-full px-4 py-1.5 text-center shadow-sm",
      css: {
        backgroundColor: "var(--color-brand-secondary)",
        color: "var(--color-brand-on-accent)",
        transition:
          "background-color var(--theme-transition-duration) ease, color var(--theme-transition-duration) ease",
      },
      hover: "hover:bg-brand-secondary/90",
    },
    usage: "Header nav, secondary actions on gradient backgrounds",
    doNotUseWhen:
      "Light backgrounds where the gold secondary color lacks sufficient contrast",
  },

  ctaDark: {
    description:
      "Primary CTA pill with brand-primary (teal) background. The main conversion action button.",
    applicableModes: ["marketing", "campaign", "editorial"],
    base: {
      classes:
        "inline-block min-w-0 rounded-full px-4 py-1.5 text-center shadow-sm",
      css: {
        backgroundColor: "var(--color-brand-primary)",
        color: "var(--color-brand-on-primary)",
        transition:
          "background-color var(--theme-transition-duration) ease, color var(--theme-transition-duration) ease",
      },
      hover: "hover:bg-brand-primary/90",
    },
    usage: "Primary booking actions, main conversion CTAs",
    doNotUseWhen: "Already inside a gradient hero panel where teal on teal reduces visibility",
  },

  headerGradient: {
    description:
      "Three-stop vertical gradient for the site header. Transitions from deep navy through mid-blue to brand primary.",
    applicableModes: ["marketing", "editorial"],
    base: {
      classes: "",
      css: {
        backgroundImage:
          "linear-gradient(to bottom, var(--color-brand-gradient-start), var(--color-brand-gradient-mid) 40%, var(--color-brand-gradient-end))",
      },
    },
    usage: "Site header background on all pages",
    doNotUseWhen: "Transparent or minimal header variants",
  },

  heroGradientOverlay: {
    description:
      "Subtle 135-degree gradient overlay at 10% opacity for hero image backgrounds. Creates a branded tint without obscuring imagery.",
    applicableModes: ["marketing", "campaign"],
    base: {
      classes: "absolute inset-0",
      css: {
        backgroundImage:
          "linear-gradient(135deg, var(--color-brand-gradient-start) 0%, var(--color-brand-primary) 100%)",
        opacity: "0.10",
        transition: "opacity var(--theme-transition-duration) ease",
      },
    },
    variants: {
      dark: {
        css: {
          backgroundImage: "none",
          opacity: "0",
        },
      },
    },
    usage: "Over hero background images to add brand color tint",
    doNotUseWhen: "Dark mode (overlay is hidden); purely decorative gradient sections without imagery",
  },

  accordionItem: {
    description:
      "Branded accordion styling with chevron indicator, rounded surface, and brand-primary hover tint.",
    applicableModes: ["editorial", "marketing"],
    base: {
      classes: "",
      css: {
        cursor: "pointer",
        listStyle: "none",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        inlineSize: "100%",
        borderRadius: "0.75rem",
        transition:
          "color var(--theme-transition-duration) ease, background-color var(--theme-transition-duration) ease",
      },
      hover: "hover:bg-brand-primary/12 hover:text-brand-primary",
    },
    usage: "FAQ sections, expandable content panels, guide detail sections",
    doNotUseWhen: "Nested accordions (use flat content instead)",
  },

  progressBar: {
    description:
      "Progress indicator bar using brand-secondary (gold) fill. Used for scroll progress and step indicators.",
    applicableModes: ["marketing", "editorial"],
    base: {
      classes: "",
      css: {
        backgroundColor: "var(--color-brand-secondary)",
      },
    },
    usage: "Scroll progress bars, step indicators, reading progress",
  },
};
