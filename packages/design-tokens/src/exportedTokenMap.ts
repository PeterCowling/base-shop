// packages/design-tokens/src/exportedTokenMap.ts
// Map of design token CSS variables to their corresponding `var(--token)` value.
//
// The map should stay in sync with the token definitions in
// `packages/themes/base/src/tokens.ts`. Each key is a CSS variable name and the
// value references the variable using the standard `var(--token)` syntax.

export const exportedTokenMap = {
  "--color-bg": "var(--color-bg)",
  "--color-fg": "var(--color-fg)",
  "--color-primary": "var(--color-primary)",
  "--color-primary-fg": "var(--color-primary-fg)",
  "--color-accent": "var(--color-accent)",
  "--color-accent-fg": "var(--color-accent-fg)",
  "--color-danger": "var(--color-danger)",
  "--color-danger-fg": "var(--color-danger-fg)",
  "--color-success": "var(--color-success)",
  "--color-success-fg": "var(--color-success-fg)",
  "--color-warning": "var(--color-warning)",
  "--color-warning-fg": "var(--color-warning-fg)",
  "--color-info": "var(--color-info)",
  "--color-info-fg": "var(--color-info-fg)",
  "--color-muted": "var(--color-muted)",
  "--font-sans": "var(--font-sans)",
  "--font-mono": "var(--font-mono)",
  // Three-font model and CMS text theme hooks
  "--font-body": "var(--font-body)",
  "--font-heading-1": "var(--font-heading-1)",
  "--font-heading-2": "var(--font-heading-2)",
  "--typography-body-font-family": "var(--typography-body-font-family)",
  "--text-heading-1-font-family": "var(--text-heading-1-font-family)",
  "--text-heading-2-font-family": "var(--text-heading-2-font-family)",
  "--space-1": "var(--space-1)",
  "--space-2": "var(--space-2)",
  "--space-3": "var(--space-3)",
  "--space-4": "var(--space-4)",
  "--radius-sm": "var(--radius-sm)",
  "--radius-md": "var(--radius-md)",
  "--radius-lg": "var(--radius-lg)",
  "--shadow-sm": "var(--shadow-sm)",
  "--shadow-md": "var(--shadow-md)",
  "--shadow-lg": "var(--shadow-lg)",
} as const;

export type ExportedTokenMap = typeof exportedTokenMap;
