// packages/design-tokens/src/exportedTokenMap.ts
// Map of design token CSS variables to their corresponding `var(--token)` value.
//
// The map should stay in sync with the token definitions in
// `packages/themes/base/src/tokens.ts`. Each key is a CSS variable name and the
// value references the variable using the standard `var(--token)` syntax.

export const exportedTokenMap = {
  // Neutral core
  "--color-bg": "var(--color-bg)",
  "--color-fg": "var(--color-fg)",
  // Neutral extensions
  "--color-bg-1": "var(--color-bg-1)",
  "--color-bg-2": "var(--color-bg-2)",
  "--color-bg-3": "var(--color-bg-3)",
  "--color-bg-4": "var(--color-bg-4)",
  "--color-bg-5": "var(--color-bg-5)",
  "--color-panel": "var(--color-panel)",
  "--color-inset": "var(--color-inset)",
  "--color-border": "var(--color-border)",
  "--color-border-strong": "var(--color-border-strong)",
  "--color-border-muted": "var(--color-border-muted)",
  "--color-fg-muted": "var(--color-fg-muted)",
  // Brand families
  "--color-primary": "var(--color-primary)",
  "--color-primary-fg": "var(--color-primary-fg)",
  "--color-primary-soft": "var(--color-primary-soft)",
  "--color-primary-hover": "var(--color-primary-hover)",
  "--color-primary-active": "var(--color-primary-active)",
  "--color-accent": "var(--color-accent)",
  "--color-accent-fg": "var(--color-accent-fg)",
  "--color-accent-soft": "var(--color-accent-soft)",
  "--color-danger": "var(--color-danger)",
  "--color-danger-fg": "var(--color-danger-fg)",
  "--color-danger-soft": "var(--color-danger-soft)",
  "--color-success": "var(--color-success)",
  "--color-success-fg": "var(--color-success-fg)",
  "--color-success-soft": "var(--color-success-soft)",
  "--color-warning": "var(--color-warning)",
  "--color-warning-fg": "var(--color-warning-fg)",
  "--color-warning-soft": "var(--color-warning-soft)",
  "--color-info": "var(--color-info)",
  "--color-info-fg": "var(--color-info-fg)",
  "--color-info-soft": "var(--color-info-soft)",
  "--color-muted": "var(--color-muted)",
  // Accessible link color
  "--color-link": "var(--color-link)",
  // Interaction helpers
  "--color-focus-ring": "var(--color-focus-ring)",
  "--color-selection": "var(--color-selection)",
  "--color-highlight": "var(--color-highlight)",
  "--color-muted-fg": "var(--color-muted-fg)",
  "--color-muted-border": "var(--color-muted-border)",
  // Translucent overlays
  "--overlay-scrim-1": "var(--overlay-scrim-1)",
  "--overlay-scrim-2": "var(--overlay-scrim-2)",
  // Hero foreground and gradients
  "--hero-fg": "var(--hero-fg)",
  "--gradient-hero-from": "var(--gradient-hero-from)",
  "--gradient-hero-via": "var(--gradient-hero-via)",
  "--gradient-hero-to": "var(--gradient-hero-to)",
  "--hero-contrast-overlay": "var(--hero-contrast-overlay)",
  // Fonts
  "--font-sans": "var(--font-sans)",
  "--font-mono": "var(--font-mono)",
  // Three-font model and CMS text theme hooks
  "--font-body": "var(--font-body)",
  "--font-heading-1": "var(--font-heading-1)",
  "--font-heading-2": "var(--font-heading-2)",
  "--typography-body-font-family": "var(--typography-body-font-family)",
  "--text-heading-1-font-family": "var(--text-heading-1-font-family)",
  "--text-heading-2-font-family": "var(--text-heading-2-font-family)",
  // Spacing
  "--space-1": "var(--space-1)",
  "--space-2": "var(--space-2)",
  "--space-3": "var(--space-3)",
  "--space-4": "var(--space-4)",
  // Radii
  "--radius-sm": "var(--radius-sm)",
  "--radius-md": "var(--radius-md)",
  "--radius-lg": "var(--radius-lg)",
  // Shadows
  "--shadow-sm": "var(--shadow-sm)",
  "--shadow-md": "var(--shadow-md)",
  "--shadow-lg": "var(--shadow-lg)",
} as const;

export type ExportedTokenMap = typeof exportedTokenMap;
