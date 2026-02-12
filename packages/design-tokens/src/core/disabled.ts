/**
 * Disabled state color tokens
 * Semantic tokens for consistent disabled UI across all contexts
 */

export const disabledColors = {
  text: 'var(--color-muted-foreground)',
  background: 'var(--color-muted)',
  border: 'var(--color-border)',
  opacity: '0.5',
} as const;

export type DisabledColor = keyof typeof disabledColors;
