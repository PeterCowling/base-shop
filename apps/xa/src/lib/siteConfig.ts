/* eslint-disable ds/no-hardcoded-copy -- XA-123 [ttl=2026-12-31] XA marketing copy pending localization */
import type { XaCategory, XaDepartment } from "./xaTypes";

const STEALTH_MODE = ["1", "true"].includes(
  (process.env.NEXT_PUBLIC_STEALTH_MODE ?? "").toLowerCase(),
);
const STEALTH_BRAND_NAME =
  process.env.NEXT_PUBLIC_STEALTH_BRAND_NAME ??
  "Private preview"; // i18n-exempt -- XA-0001 [ttl=2026-12-31] stealth placeholder

const publicConfig = {
  brandName:
    process.env.NEXT_PUBLIC_BRAND_NAME ??
    "XA-C", // i18n-exempt -- XA-0001 [ttl=2026-12-31] placeholder brand name
  domain:
    process.env.NEXT_PUBLIC_SITE_DOMAIN ??
    process.env.NEXT_PUBLIC_DOMAIN ??
    "example.com", // i18n-exempt -- XA-0012: placeholder domain
  legalEntityName:
    process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME ?? "Your Legal Entity Name", // i18n-exempt -- XA-0012: placeholder legal entity
  legalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "Your registered address", // i18n-exempt -- XA-0012: placeholder legal address
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com", // i18n-exempt -- XA-0012: placeholder email
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+00 000 000 000", // i18n-exempt -- XA-0012: placeholder number
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://instagram.com/xa", // i18n-exempt -- XA-0012: placeholder instagram
  wechatId: process.env.NEXT_PUBLIC_WECHAT_ID ?? "xa-support", // i18n-exempt -- XA-0012: placeholder WeChat
  businessHours: process.env.NEXT_PUBLIC_BUSINESS_HOURS ?? "Mon–Fri 09:00–18:00", // i18n-exempt -- XA-0012: placeholder hours
  jurisdiction: process.env.NEXT_PUBLIC_JURISDICTION ?? "Your jurisdiction", // i18n-exempt -- XA-0012: placeholder jurisdiction
} as const;

const stealthConfig = {
  brandName: STEALTH_BRAND_NAME,
  domain: "",
  legalEntityName: "",
  legalAddress: "",
  supportEmail: "",
  whatsappNumber: "",
  instagramUrl: "",
  wechatId: "",
  businessHours: "",
  jurisdiction: "",
} as const;

const baseConfig = STEALTH_MODE ? stealthConfig : publicConfig;

const catalogConfig = {
  category: "clothing" as XaCategory,
  categories: ["clothing"] as XaCategory[],
  departments: ["women", "men"] as XaDepartment[],
  defaultDepartment: "women" as XaDepartment,
  label: "Clothing",
  labelPlural: "clothing",
  productNoun: "garment",
  productNounPlural: "garments",
  productDescriptor: "ready-to-wear clothing",
  packagingItems: "garment bags or boxes",
} as const;

export const siteConfig = {
  ...baseConfig,
  catalog: catalogConfig,
  stealthMode: STEALTH_MODE,
  showContactInfo: !STEALTH_MODE,
  showLegalInfo: !STEALTH_MODE,
  showSocialLinks: !STEALTH_MODE,
} as const;
