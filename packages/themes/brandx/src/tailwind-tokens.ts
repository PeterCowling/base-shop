/* i18n-exempt file -- CHORE-0000 design token map; not user-facing copy [ttl=2026-12-31] */
// packages/themes/brandx/tailwind-tokens.ts
//
// Default design token overrides for the brandx theme.

export const tokens = {
  "--color-bg": "0 0% 100%",
  "--color-bg-dark": "0 0% 4%",
  "--color-fg": "0 0% 10%",
  "--color-fg-dark": "0 0% 93%",
  "--color-primary": "340 80% 50%",
  "--color-primary-dark": "340 80% 60%",
  "--color-primary-fg": "0 0% 100%",
  "--color-primary-fg-dark": "0 0% 10%",
  "--color-accent": "40 95% 50%",
  "--color-accent-dark": "40 95% 60%",
  "--color-success": "142 76% 97%",
  "--color-success-dark": "142 72% 27%",
  "--color-success-fg": "142 72% 30%",
  "--color-success-fg-dark": "142 70% 94%",
  "--color-warning": "40 90% 96%",
  "--color-warning-dark": "35 90% 30%",
  "--color-warning-fg": "25 85% 31%",
  "--color-warning-fg-dark": "40 90% 96%",
  "--color-info": "210 90% 96%",
  "--color-info-dark": "210 90% 35%",
  "--color-info-fg": "210 90% 35%",
  "--color-info-fg-dark": "210 90% 96%",
  "--color-muted": "0 0% 88%",
  "--color-muted-dark": "0 0% 60%",
  "--font-sans": 'var(--font-geist-sans)',
  "--font-mono": 'var(--font-geist-mono)',
  "--space-1": "4px",
  "--space-2": "8px",
  "--space-3": "12px",
  "--space-4": "16px",
  "--radius-sm": "4px",
  "--radius-md": "8px",
  "--radius-lg": "12px",
  "--shadow-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)", // i18n-exempt: design tokens (CSS shadow values; not user-facing copy)
  "--shadow-md":
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // i18n-exempt: design tokens (CSS shadow values; not user-facing copy)
  "--shadow-lg":
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", // i18n-exempt: design tokens (CSS shadow values; not user-facing copy)
} as const;
