// packages/themes/base/tokens.ts
/**
 * Central colour-/spacing-/font-token catalogue.
 * Every token has a `light` value and may provide a `dark` variant.
 */

import { EXTENDED_TOKENS } from './tokens.extensions';

export interface Token {
  /** CSS colour / length / font list used in light mode */
  readonly light: string;
  /** Optional counterpart for dark mode */
  readonly dark?: string;
}

/** `--token-name`: `{ light, dark? }` */
export type TokenMap = Record<`--${string}`, Token>;

export const tokens = {
  // Neutral core
  "--color-bg": { light: "0 0% 100%", dark: "0 0% 4%" },
  "--color-fg": { light: "0 0% 10%", dark: "0 0% 93%" },
  // Neutral extensions (12-step semantic mapping)
  "--color-bg-1": { light: "0 0% 100%", dark: "0 0% 4%" },
  "--color-bg-2": { light: "0 0% 98%", dark: "0 0% 6%" },
  "--color-bg-3": { light: "0 0% 96%", dark: "0 0% 9%" },
  "--color-bg-4": { light: "0 0% 94%", dark: "0 0% 12%" },
  "--color-bg-5": { light: "0 0% 92%", dark: "0 0% 15%" },
  "--color-panel": { light: "0 0% 96%", dark: "0 0% 12%" },
  "--color-inset": { light: "0 0% 98%", dark: "0 0% 9%" },
  "--color-border": { light: "0 0% 80%", dark: "0 0% 30%" },
  "--color-border-strong": { light: "0 0% 65%", dark: "0 0% 45%" },
  "--color-border-muted": { light: "0 0% 88%", dark: "0 0% 22%" },
  "--color-fg-muted": { light: "0 0% 40%", dark: "0 0% 75%" },
  // Layered surfaces + form inputs
  "--surface-1": { light: "0 0% 100%", dark: "0 0% 4%" },
  "--surface-2": { light: "0 0% 96%", dark: "222 14% 13%" },
  "--surface-3": { light: "0 0% 92%", dark: "222 12% 16%" },
  "--surface-input": { light: "0 0% 96%", dark: "222 12% 18%" },
  // Brand families
  "--color-primary": { light: "220 90% 56%", dark: "220 90% 66%" },
  // In dark theme, foreground on primary should remain dark for contrast
  "--color-primary-fg": { light: "0 0% 100%", dark: "0 0% 10%" },
  "--color-primary-soft": { light: "220 90% 96%", dark: "220 90% 18%" },
  "--color-primary-hover": { light: "220 90% 50%", dark: "220 90% 72%" },
  "--color-primary-active": { light: "220 90% 45%", dark: "220 90% 78%" },
  "--color-accent": { light: "260 83% 70%", dark: "260 83% 70%" },
  "--color-accent-fg": { light: "0 0% 10%", dark: "0 0% 10%" },
  "--color-accent-soft": { light: "260 83% 97%", dark: "260 83% 20%" },
  "--color-danger": { light: "0 86% 97%", dark: "0 63% 31%" },
  "--color-danger-fg": { light: "0 74% 42%", dark: "0 93% 94%" },
  "--color-danger-soft": { light: "0 100% 98%", dark: "0 50% 20%" },
  "--color-success": { light: "142 76% 97%", dark: "142 72% 27%" },
  "--color-success-fg": { light: "142 72% 30%", dark: "142 70% 94%" },
  "--color-success-soft": { light: "142 76% 96%", dark: "142 60% 18%" },
  "--color-warning": { light: "40 90% 96%", dark: "35 90% 30%" },
  "--color-warning-fg": { light: "25 85% 31%", dark: "40 90% 96%" },
  "--color-warning-soft": { light: "40 90% 95%", dark: "35 70% 20%" },
  "--color-info": { light: "210 90% 96%", dark: "210 90% 35%" },
  "--color-info-fg": { light: "210 90% 35%", dark: "210 90% 96%" },
  "--color-info-soft": { light: "210 90% 95%", dark: "210 70% 20%" },
  "--color-muted": { light: "0 0% 88%", dark: "0 0% 32%" },
  // Accessible link color (AA on light surfaces)
  "--color-link": { light: "220 75% 40%", dark: "220 80% 70%" },
  // Interaction helpers
  "--color-focus-ring": { light: "220 90% 56%", dark: "220 90% 66%" },
  "--ring": { light: "220 90% 56%", dark: "220 90% 66%" },
  "--ring-offset": { light: "0 0% 100%", dark: "0 0% 4%" },
  "--ring-width": { light: "2px" },
  "--ring-offset-width": { light: "2px" },
  "--color-selection": { light: "260 83% 92%", dark: "220 30% 40%" },
  "--color-highlight": { light: "260 83% 97%", dark: "220 25% 30%" },
  "--color-muted-fg": { light: "0 0% 20%", dark: "0 0% 92%" },
  "--color-muted-border": { light: "0 0% 72%", dark: "0 0% 40%" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--border-1": { light: "var(--color-fg) / 0.12", dark: "var(--color-fg) / 0.12" },
  "--border-2": { light: "var(--color-fg) / 0.22", dark: "var(--color-fg) / 0.22" },
  "--border-3": { light: "var(--color-fg) / 0.38", dark: "var(--color-fg) / 0.38" },
  // Translucent overlays
  "--overlay-scrim-1": { light: "0 0% 0% / 0.40", dark: "0 0% 100% / 0.40" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--overlay-scrim-2": { light: "0 0% 0% / 0.64", dark: "0 0% 100% / 0.64" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  // Foreground color suitable for hero backgrounds (paired with bg-hero-contrast)
  "--hero-fg": { light: "0 0% 100%", dark: "0 0% 100%" },
  "--font-sans": { light: 'var(--font-geist-sans)' },
  "--font-mono": { light: 'var(--font-geist-mono)' },
  // Three-font typography model
  // Body copy defaults to sans until configured
  "--font-body": { light: 'var(--font-sans)' },
  // Primary and secondary heading families default to body until configured
  "--font-heading-1": { light: 'var(--font-sans)' },
  "--font-heading-2": { light: 'var(--font-sans)' },
  // Text theme hooks used by the CMS page builder to extract typography themes
  "--typography-body-font-family": { light: 'var(--font-body)' },
  "--text-heading-1-font-family": { light: 'var(--font-heading-1)' },
  "--text-heading-2-font-family": { light: 'var(--font-heading-2)' },
  "--space-1": { light: "4px" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--space-2": { light: "8px" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--space-3": { light: "12px" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--space-4": { light: "16px" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--radius-sm": { light: "4px" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--radius-md": { light: "8px" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--radius-lg": { light: "12px" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--shadow-sm": { light: "0 1px 2px 0 rgb(0 0 0 / 0.05)" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--shadow-md": {
    light: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  },
  "--shadow-lg": {
    light: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  },
  // Gradient tokens (used by bg-hero utility)
  "--gradient-hero-from": { light: "234 89% 60%" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--gradient-hero-via": { light: "270 83% 60%" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  "--gradient-hero-to": { light: "222 47% 11%" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
  // Overlay used by bg-hero-contrast to guarantee text contrast
  "--hero-contrast-overlay": { light: "0 0% 0% / 0.55", dark: "0 0% 0% / 0.55" }, // i18n-exempt -- DS-000 design token numeric CSS value [ttl=2026-01-01]
} as const satisfies TokenMap;

// Append additive tokens (spacing, radii, breakpoints, a11y, safe-area)
// while preserving the authoritative TokenMap shape.
// We convert flat values to `{ light: value }` Token entries.
Object.assign(
  tokens as Record<string, Token>,
  Object.fromEntries(
    Object.entries(EXTENDED_TOKENS).map(([k, v]) => [k, { light: v } as Token])
  )
);
