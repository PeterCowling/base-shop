/* i18n-exempt file -- THEME-0001: Design token CSS values; not user-facing */
// packages/themes/dark/tailwind-tokens.ts
//
// Default design token overrides for the dark theme.

export const tokens = {
  "--color-bg": "0 0% 4%",
  "--color-fg": "0 0% 93%",
  "--color-primary": "220 90% 66%",
  "--color-primary-fg": "0 0% 10%",
  "--color-accent": "260 83% 15%",
  "--color-accent-fg": "0 0% 90%",
  "--color-danger": "0 63% 31%",
  "--color-danger-fg": "0 93% 94%",
  "--color-success": "142 72% 27%",
  "--color-success-fg": "142 70% 94%",
  "--color-warning": "35 90% 30%",
  "--color-warning-fg": "40 90% 96%",
  "--color-info": "210 90% 35%",
  "--color-info-fg": "210 90% 96%",
  "--color-link": "220 80% 70%",
  "--color-link-dark": "220 80% 70%",
  "--color-muted": "0 0% 60%",
  "--color-muted-fg": "0 0% 92%",
  "--color-muted-border": "0 0% 40%",

  // Layered surfaces
  "--surface-1": "0 0% 4%",
  "--surface-2": "222 14% 13%",
  "--surface-3": "222 12% 16%",
  "--surface-input": "222 12% 18%",

  // Border intensity scale
  "--border-1": "var(--color-fg) / 0.12",
  "--border-2": "var(--color-fg) / 0.22",
  "--border-3": "var(--color-fg) / 0.38",

  // Focus ring tokens
  "--ring": "220 90% 66%",
  "--ring-offset": "0 0% 4%",
  "--ring-width": "2px",
  "--ring-offset-width": "2px",

  // Hero gradient
  "--gradient-hero-from": "234 70% 55%",
  "--gradient-hero-via": "272 60% 52%",
  "--gradient-hero-to": "222 30% 18%",
  "--font-sans": 'var(--font-geist-sans)',
  "--font-mono": 'var(--font-geist-mono)',
  "--space-1": "4px",
  "--space-2": "8px",
  "--space-3": "12px",
  "--space-4": "16px",
  "--radius-sm": "4px",
  "--radius-md": "8px",
  "--radius-lg": "12px",
  "--shadow-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)", // i18n-exempt: design token CSS value, not user-facing copy
  "--shadow-md":
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)", // i18n-exempt: design token CSS value, not user-facing copy
  "--shadow-lg":
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)", // i18n-exempt: design token CSS value, not user-facing copy
  // Elevation tokens (for Tailwind boxShadow aliases)
  "--elevation-0": "none", // i18n-exempt: design token CSS value, not user-facing copy
  "--elevation-1": "0 1px 2px rgba(0,0,0,0.14)", // i18n-exempt: design token CSS value, not user-facing copy
  "--elevation-2": "0 2px 6px rgba(0,0,0,0.18)", // i18n-exempt: design token CSS value, not user-facing copy
  "--elevation-3": "0 4px 12px rgba(0,0,0,0.24)", // i18n-exempt: design token CSS value, not user-facing copy
  "--elevation-4": "0 8px 24px rgba(0,0,0,0.30)", // i18n-exempt: design token CSS value, not user-facing copy
  "--elevation-5": "0 12px 36px rgba(0,0,0,0.36)", // i18n-exempt: design token CSS value, not user-facing copy
} as const;
