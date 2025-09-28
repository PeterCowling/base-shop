/* i18n-exempt file -- CMS-PRICING-1001 CSS utility classes only; not user-facing copy [ttl=2026-12-31] */

const BTN_BASE_TOKENS = ["h-9", "flex-1", "rounded-lg", "text-xs"] as const;
export const BTN_BASE = BTN_BASE_TOKENS.join(" ");
// Variant A: emphasized (bg surface)
const VARIANT_A_TOKENS = ["border-border-1", "bg-surface-2", "text-foreground"] as const;
export const VARIANT_A = VARIANT_A_TOKENS.join(" ");
// Variant B: outline-only
const VARIANT_B_TOKENS = ["border-border-2", "text-foreground"] as const;
export const VARIANT_B = VARIANT_B_TOKENS.join(" ");
