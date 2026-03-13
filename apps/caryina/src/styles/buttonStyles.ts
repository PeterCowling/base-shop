/**
 * Shared primary button className constant for caryina.
 * Replicates the token-based .btn-primary utility using DS Button passthrough mode.
 * All call sites import this constant instead of using the CSS utility class.
 */
export const BTN_PRIMARY =
  "inline-flex items-center justify-center bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-fg))] font-medium transition-colors hover:bg-[hsl(var(--color-primary-hover))] active:bg-[hsl(var(--color-primary-active))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--color-focus-ring))] disabled:opacity-50";
