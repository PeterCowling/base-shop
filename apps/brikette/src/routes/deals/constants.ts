import { Coffee, Percent, Wine } from "lucide-react";
import enDealsFallback from "@/locales/en/dealsPage.json";
import enTokens from "@/locales/en/_tokens.json";

export const DEALS_NAMESPACE = "dealsPage" as const;
export const OPTIONAL_NAMESPACES = ["modals"];

export const DISCOUNT_PCT = 15;
export const BEDS_LEFT = 6;
export const DEAL_END = new Date("2025-10-31T23:59:59Z");
export const DEAL_VALIDITY_START = new Date(2025, 4, 29);
export const DEAL_VALIDITY_END = new Date(2025, 9, 31);
export const DEAL_VALIDITY = {
  start: DEAL_VALIDITY_START,
  end: DEAL_VALIDITY_END,
} as const;

const FALLBACK_CTA_BUTTONS = [
  {
    label: enTokens.bookNow,
  },
] as const;

export const FALLBACK_DEALS = {
  ...enDealsFallback,
  meta: {
    ...enDealsFallback.meta,
    banner: enDealsFallback.banner,
    promo: enDealsFallback.promo,
  },
  cta: {
    buttons: FALLBACK_CTA_BUTTONS,
  },
} as const;

export const PERKS_HEADING_ID = "perks-heading" as const; // i18n-exempt -- I18N-4822 [ttl=2026-12-31] Accessibility identifier
export const RESTRICTIONS_HEADING_ID = "restrictions-heading" as const; // i18n-exempt -- I18N-4822 [ttl=2026-12-31] Accessibility identifier

export const PLACEHOLDER_TOKEN_REGEX = /{{\s*[^}]+\s*}}/;
export const TEMPLATE_TOKEN_REGEX = /{{\s*([^}]+?)\s*}}/g;

export const PERK_ICONS = [Percent, Coffee, Wine] as const;
export const DEFAULT_PERK_ICON = Percent;

export const OG_IMAGE_PATH = "/img/og-deals.jpg";
