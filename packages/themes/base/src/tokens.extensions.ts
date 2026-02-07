/**
 * Additive flat CSS variable tokens that extend your existing DS without reshaping it.
 * Merge these into the authoritative map in tokens.ts (e.g., { ...existing, ...EXTENDED_TOKENS }).
 * Values align to: WCAG 2.2 target size ≥24px; Apple HIG 44pt; Material 48dp; Polaris breakpoints.
 *
 * SINGLE SOURCE OF TRUTH: This file defines core design tokens (spacing, typography, z-index).
 * The @acme/design-tokens package imports these values rather than duplicating them.
 */

export type TokenRecord = Readonly<Record<string, string>>;

/**
 * Core spacing scale - 4px grid system
 * Universal across all contexts
 */
export const coreSpacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

/**
 * Core typography scales
 */
export const coreFontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
} as const;

export const coreFontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const coreLineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

/**
 * Z-index scale — semantic layering for overlay components.
 * 100-increment gaps leave room for intermediate values.
 *
 * DECISION-08: Scale chosen to support modal stacking,
 * dropdowns over sticky headers, and toast above everything.
 */
export const coreZIndex = {
  base: '0',
  dropdown: '100',
  sticky: '200',
  fixed: '300',
  modalBackdrop: '400',
  modal: '500',
  popover: '600',
  tooltip: '700',
  toast: '800',
  max: '9999',
} as const;

export const EXTENDED_TOKENS: TokenRecord = {
  /* Typography scale */
  "--text-xs": coreFontSizes.xs,
  "--text-sm": coreFontSizes.sm,
  "--text-base": coreFontSizes.base,
  "--text-lg": coreFontSizes.lg,
  "--text-xl": coreFontSizes.xl,
  "--text-2xl": coreFontSizes['2xl'],
  "--text-3xl": coreFontSizes['3xl'],
  "--text-4xl": coreFontSizes['4xl'],
  "--text-5xl": coreFontSizes['5xl'],

  /* Font weights */
  "--font-weight-light": coreFontWeights.light,
  "--font-weight-normal": coreFontWeights.normal,
  "--font-weight-medium": coreFontWeights.medium,
  "--font-weight-semibold": coreFontWeights.semibold,
  "--font-weight-bold": coreFontWeights.bold,

  /* Line heights */
  "--leading-none": coreLineHeights.none,
  "--leading-tight": coreLineHeights.tight,
  "--leading-snug": coreLineHeights.snug,
  "--leading-normal": coreLineHeights.normal,
  "--leading-relaxed": coreLineHeights.relaxed,
  "--leading-loose": coreLineHeights.loose,

  /* Spacing — 8‑pt rhythm with 4‑pt small steps  */
  "--space-0": coreSpacing[0],
  "--space-5": coreSpacing[5],
  "--space-6": coreSpacing[6],
  "--space-8": coreSpacing[8],
  "--space-10": coreSpacing[10],
  "--space-12": coreSpacing[12],
  "--space-16": coreSpacing[16],
  "--space-20": coreSpacing[20],
  "--space-24": coreSpacing[24],

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

  /* Z-index scale (DECISION-08) */
  "--z-base": coreZIndex.base,
  "--z-dropdown": coreZIndex.dropdown,
  "--z-sticky": coreZIndex.sticky,
  "--z-fixed": coreZIndex.fixed,
  "--z-modal-backdrop": coreZIndex.modalBackdrop,
  "--z-modal": coreZIndex.modal,
  "--z-popover": coreZIndex.popover,
  "--z-tooltip": coreZIndex.tooltip,
  "--z-toast": coreZIndex.toast,
  "--z-max": coreZIndex.max,

  /* Safe‑area insets (for full‑bleed layouts across devices) */
  "--safe-top": "env(safe-area-inset-top, 0px)",
  "--safe-right": "env(safe-area-inset-right, 0px)",
  "--safe-bottom": "env(safe-area-inset-bottom, 0px)",
  "--safe-left": "env(safe-area-inset-left, 0px)",
};
