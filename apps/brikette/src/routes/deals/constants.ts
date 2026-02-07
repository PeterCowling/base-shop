import { Coffee, Percent, Wine } from "@/icons";
import enTokens from "@/locales/en/_tokens.json";
import enDealsFallback from "@/locales/en/dealsPage.json";

export const DEALS_NAMESPACE = "dealsPage" as const;
export const OPTIONAL_NAMESPACES = ["modals"];

export const BEDS_LEFT = 6;

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
