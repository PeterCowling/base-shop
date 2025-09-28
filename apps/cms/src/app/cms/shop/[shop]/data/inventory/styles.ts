/* i18n-exempt file -- CMS-INV-1001 utility classes only; not user-facing copy [ttl=2026-12-31] */

const INVENTORY_STAT_ACCENT_TOKENS = ["bg-surface-3", "text-foreground"] as const;
export const INVENTORY_STAT_ACCENT = INVENTORY_STAT_ACCENT_TOKENS.join(" ");

const INVENTORY_STAT_CONTAINER_TOKENS = [
  "rounded-2xl",
  "border",
  "border-border/10",
  "px-4",
  "py-3",
] as const;
export const INVENTORY_STAT_CONTAINER = INVENTORY_STAT_CONTAINER_TOKENS.join(" ");
