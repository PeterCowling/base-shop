import { xaI18n } from "./xaI18n";
import type { XaCategory, XaDepartment } from "./xaTypes";

const STEALTH_MODE = ["1", "true"].includes(
  (process.env.NEXT_PUBLIC_STEALTH_MODE ?? "").toLowerCase(),
);
const STEALTH_BRAND_NAME =
  process.env.NEXT_PUBLIC_STEALTH_BRAND_NAME ??
  "Private preview"; // i18n-exempt -- XA-0001 [ttl=2026-12-31] stealth placeholder

function readPublicEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

function buildPublicConfig() {
  const brandName = readPublicEnv("NEXT_PUBLIC_BRAND_NAME") || "XA-B";
  const domain =
    readPublicEnv("NEXT_PUBLIC_SITE_DOMAIN") || readPublicEnv("NEXT_PUBLIC_DOMAIN");
  const legalEntityName = readPublicEnv("NEXT_PUBLIC_LEGAL_ENTITY_NAME");
  const legalAddress = readPublicEnv("NEXT_PUBLIC_LEGAL_ADDRESS");
  const supportEmail = readPublicEnv("NEXT_PUBLIC_SUPPORT_EMAIL");
  const whatsappNumber = readPublicEnv("NEXT_PUBLIC_WHATSAPP_NUMBER");
  const instagramUrl = readPublicEnv("NEXT_PUBLIC_INSTAGRAM_URL");
  const wechatId = readPublicEnv("NEXT_PUBLIC_WECHAT_ID");
  const businessHours = readPublicEnv("NEXT_PUBLIC_BUSINESS_HOURS");
  const jurisdiction = readPublicEnv("NEXT_PUBLIC_JURISDICTION");

  const hasContactInfo = Boolean(supportEmail || whatsappNumber || wechatId || businessHours);
  const hasSocialLinks = Boolean(whatsappNumber || instagramUrl);
  const hasLegalInfo = Boolean(legalEntityName || legalAddress || jurisdiction || domain);

  return {
    brandName,
    domain,
    legalEntityName,
    legalAddress,
    supportEmail,
    whatsappNumber,
    instagramUrl,
    wechatId,
    businessHours,
    jurisdiction,
    showContactInfo: hasContactInfo,
    showLegalInfo: hasLegalInfo,
    showSocialLinks: hasSocialLinks,
  } as const;
}

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
  showContactInfo: false,
  showLegalInfo: false,
  showSocialLinks: false,
} as const;

const baseConfig = STEALTH_MODE ? stealthConfig : buildPublicConfig();

const catalogConfig = {
  category: "bags" as XaCategory,
  categories: ["bags"] as XaCategory[],
  departments: ["women", "men", "kids"] as XaDepartment[],
  defaultDepartment: "women" as XaDepartment,
  label: "Bags",
  labelPlural: "bags",
  productNoun: "bag",
  productNounPlural: "bags",
  productDescriptor: xaI18n.t("xaB.src.lib.siteconfig.l62c22"),
  packagingItems: xaI18n.t("xaB.src.lib.siteconfig.l63c19"),
} as const;

export const siteConfig = {
  ...baseConfig,
  catalog: catalogConfig,
  stealthMode: STEALTH_MODE,
  heroHeadline: "The finest carry goods. By invitation.",
  heroSubheadline: "Exclusive access to curated bags from established designers.",
} as const;
