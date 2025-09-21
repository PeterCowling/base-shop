// packages/themes/bcd/tailwind-tokens.ts
//
// Default design token overrides for the BCD theme.

export const tokens = {
  "--color-bg": "0 0% 100%",
  "--color-fg": "0 0% 10%",
  "--color-primary": "340 80% 50%",
  "--color-primary-fg": "0 0% 100%",
  "--color-accent": "40 95% 50%",
  // hero gradient stops (indigo → purple → slate)
  "--gradient-hero-from": "234 89% 60%",
  "--gradient-hero-via": "270 83% 60%",
  "--gradient-hero-to": "222 47% 11%",
  "--color-success": "142 76% 97%",
  "--color-success-fg": "142 72% 30%",
  "--color-warning": "40 90% 96%",
  "--color-warning-fg": "25 85% 31%",
  "--color-info": "210 90% 96%",
  "--color-info-fg": "210 90% 35%",
  "--color-muted": "0 0% 88%",
  "--font-sans": 'var(--font-geist-sans)',
  "--font-mono": 'var(--font-geist-mono)',
  "--space-1": "4px",
  "--space-2": "8px",
  "--space-3": "12px",
  "--space-4": "16px",
  "--radius-sm": "4px",
  "--radius-md": "8px",
  "--radius-lg": "12px",
  "--shadow-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  "--shadow-md":
    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  "--shadow-lg":
    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
} as const;
