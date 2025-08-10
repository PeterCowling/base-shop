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
  "--color-muted": "0 0% 60%",
  "--font-sans": '"Geist Sans", system-ui, sans-serif',
  "--font-mono": '"Geist Mono", ui-monospace, monospace',
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
