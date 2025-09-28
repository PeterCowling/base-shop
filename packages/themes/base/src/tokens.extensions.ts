/**
 * Additive flat CSS variable tokens that extend your existing DS without reshaping it.
 * Merge these into the authoritative map in tokens.ts (e.g., { ...existing, ...EXTENDED_TOKENS }).
 * Values align to: WCAG 2.2 target size ≥24px; Apple HIG 44pt; Material 48dp; Polaris breakpoints.
 */

export type TokenRecord = Readonly<Record<string, string>>;

export const EXTENDED_TOKENS: TokenRecord = {
  /* Spacing — 8‑pt rhythm with 4‑pt small steps  */
  "--space-0": "0px",
  "--space-5": "20px",
  "--space-6": "24px",
  "--space-8": "32px",
  "--space-10": "40px",
  "--space-12": "48px",
  "--space-16": "64px",

  /* Corner radii — size‑based scale harmonizing Fluent 2 (2/4/8/12) + Material 3 (20–32 for large) */
  "--radius-none": "0px",
  "--radius-xs": "2px",
  /* sm, md, lg already exist; we’re adding the rest to avoid churn */
  "--radius-xl": "16px",
  "--radius-2xl": "20px",
  "--radius-3xl": "28px",
  "--radius-4xl": "32px",
  "--radius-full": "9999px",

  /* Breakpoints (Polaris‑aligned; tokens only — no global Tailwind screen change) */
  "--bp-xs": "0px",
  "--bp-sm": "490px",
  "--bp-md": "768px",
  "--bp-lg": "1040px",
  "--bp-xl": "1440px",

  /* Accessibility target sizes (encode floors + platform targets) */
  "--target-min-aa": "24px", /* WCAG 2.2 AA minimum (with spacing exceptions) */
  "--target-hig": "44px", /* Apple HIG recommended */
  "--target-material": "48px", /* Material / Android recommended */

  /* Safe‑area insets (for full‑bleed layouts across devices) */
  "--safe-top": "env(safe-area-inset-top, 0px)", // i18n-exempt -- DS-000 ttl=2025-03-31
  "--safe-right": "env(safe-area-inset-right, 0px)", // i18n-exempt -- DS-000 ttl=2025-03-31
  "--safe-bottom": "env(safe-area-inset-bottom, 0px)", // i18n-exempt -- DS-000 ttl=2025-03-31
  "--safe-left": "env(safe-area-inset-left, 0px)", // i18n-exempt -- DS-000 ttl=2025-03-31
};
