// packages/themes/base/tokens.ts
/**
 * Central colour-/spacing-/font-token catalogue.
 * Every token has a `light` value and may provide a `dark` variant.
 */

export interface Token {
  /** CSS colour / length / font list used in light mode */
  readonly light: string;
  /** Optional counterpart for dark mode */
  readonly dark?: string;
}

/** `--token-name`: `{ light, dark? }` */
export type TokenMap = Record<`--${string}`, Token>;

/* eslint-disable prettier/prettier */
export const tokens = {
  "--color-bg": { light: "0 0% 100%", dark: "0 0% 4%" },
  "--color-fg": { light: "0 0% 10%", dark: "0 0% 93%" },
  "--color-primary": { light: "220 90% 56%", dark: "220 90% 66%" },
  "--color-primary-fg": { light: "0 0% 100%" },
  "--color-accent": { light: "260 83% 67%" },
  "--color-muted": { light: "0 0% 88%", dark: "0 0% 20%" },
  "--font-sans": { light: '"Geist Sans", system-ui, sans-serif' },
  "--font-mono": { light: '"Geist Mono", ui-monospace, monospace' },
  "--space-1": { light: "4px" },
  "--space-2": { light: "8px" },
  "--space-3": { light: "12px" },
  "--space-4": { light: "16px" },
  "--radius-sm": { light: "4px" },
  "--radius-md": { light: "8px" },
  "--radius-lg": { light: "12px" },
} as const satisfies TokenMap;
