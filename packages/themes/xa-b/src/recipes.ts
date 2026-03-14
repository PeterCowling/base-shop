import type { ThemeRecipes } from "@themes/base";

/**
 * XA-B recipes — branded surface compositions.
 *
 * Extracted from:
 * - apps/xa-b/src/app/xa-cyber-atelier.css (component rules)
 * - apps/xa-b/src/app/globals.css (gate theme, layout helpers)
 *
 * These recipes formalize existing CSS classes in the three-layer schema.
 * The original classes remain in the CSS files — this file provides structured
 * metadata for agent consumption and future CSS generation.
 */
export const recipes: ThemeRecipes = {
  gateTheme: {
    description:
      "Landing gate surface with white background and near-black text. The entry composition before product browsing.",
    applicableModes: ["marketing"],
    base: {
      classes: "xa-gate-theme",
      css: {
        backgroundColor: "var(--xa-gate-bg)",
        color: "var(--xa-gate-ink)",
      },
    },
    usage: "Landing/gate pages, brand-introduction surfaces",
    doNotUseWhen: "Product listing or detail pages where the achromatic palette applies",
  },

  supportDock: {
    description:
      "Chromatic FAB accent for the support dock — the only non-achromatic element in the app. Uses HSL var tokens for guaranteed contrast.",
    applicableModes: ["marketing", "editorial"],
    base: {
      classes: "xa-support-dock-toggle",
      css: {
        backgroundColor: "hsl(var(--xa-fab-bg))",
        color: "hsl(var(--xa-fab-fg))",
      },
      hover: "hover:bg-[hsl(var(--xa-fab-hover))]",
    },
    usage: "Floating support dock toggle and action buttons",
    doNotUseWhen: "Non-interactive elements; the chromatic accent is reserved for the FAB only",
  },

  panel: {
    description:
      "Minimal card treatment with transparent background, subtle border, and hover lift. The xa-panel composition.",
    applicableModes: ["marketing", "editorial"],
    base: {
      classes: "xa-panel",
      css: {
        backgroundColor: "transparent",
        borderColor: "hsl(var(--border-1))",
        boxShadow: "none",
        transition: "box-shadow 180ms ease, transform 180ms ease",
      },
      hover: "hover:shadow-lg hover:-translate-y-0.5",
    },
    usage: "Product cards, content cards, any elevated surface",
    doNotUseWhen: "Full-width sections where card elevation is inappropriate",
  },

  pdpLayout: {
    description:
      "Product detail page typography and layout proportions. Uppercase breadcrumbs, tight tracking, modular font sizes.",
    applicableModes: ["editorial"],
    base: {
      classes: "xa-pdp",
      css: {},
    },
    usage: "Product detail pages",
    doNotUseWhen: "Non-product pages",
  },
};
