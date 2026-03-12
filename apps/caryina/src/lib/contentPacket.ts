import * as fs from "node:fs";
import * as path from "node:path";

import type { Locale } from "@acme/i18n/locales";

interface LocalizedText {
  en: string;
  de?: string;
  it?: string;
}

interface TrustStripCopy {
  delivery: LocalizedText;
  exchange: LocalizedText;
  origin: LocalizedText;
  securePayment: LocalizedText;
}

interface FaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

interface PolicyCopy {
  title: LocalizedText;
  summary: LocalizedText;
  bullets: LocalizedText[];
  notice?: LocalizedText;
}

interface ChromeContent {
  header: {
    shop: LocalizedText;
    support: LocalizedText;
    navAriaLabel: LocalizedText;
  };
  footer: {
    terms: LocalizedText;
    privacy: LocalizedText;
    returnsRefunds: LocalizedText;
    shipping: LocalizedText;
    support: LocalizedText;
    copyright: LocalizedText;
    sectionAriaLabel: LocalizedText;
  };
  consent: {
    message: LocalizedText;
    privacyLink: LocalizedText;
    decline: LocalizedText;
    accept: LocalizedText;
    ariaLabel: LocalizedText;
  };
  trust: {
    summary: LocalizedText;
    shippingLink: LocalizedText;
    returnsLink: LocalizedText;
  };
  notifyMe: {
    consent: LocalizedText;
    genericError: LocalizedText;
    validation: LocalizedText;
    emailLabel: LocalizedText;
    submit: LocalizedText;
    submitting: LocalizedText;
    success: LocalizedText;
  };
}

interface SiteContentPayload {
  sourcePaths: string[];
  seoKeywords: string[];
  home: {
    eyebrow: LocalizedText;
    heading: LocalizedText;
    summary: LocalizedText;
    ctaPrimary: LocalizedText;
    ctaSecondary: LocalizedText;
    seoHeading: LocalizedText;
    seoBody: LocalizedText;
    faqHeading: LocalizedText;
    faqItems: FaqItem[];
  };
  shop: {
    eyebrow: LocalizedText;
    heading: LocalizedText;
    summary: LocalizedText;
    trustBullets: LocalizedText[];
  };
  launchFamilies: Record<"top-handle" | "shoulder" | "mini", { label: LocalizedText; description: LocalizedText }>;
  productPage: {
    proofHeading: LocalizedText;
    proofBullets: LocalizedText[];
    relatedHeading: LocalizedText;
    trustStrip?: TrustStripCopy;
  };
  support: {
    title: LocalizedText;
    summary: LocalizedText;
    channels: LocalizedText[];
    responseSla: LocalizedText;
  };
  policies: Record<"privacy" | "shipping" | "returns" | "terms", PolicyCopy>;
  chrome?: ChromeContent;
}

const PAYLOAD_RELATIVE_PATH = "data/shops/caryina/site-content.generated.json";
const GENERATED_PAYLOAD_CANDIDATES = [
  path.resolve(process.cwd(), PAYLOAD_RELATIVE_PATH),
  path.resolve(process.cwd(), "apps/caryina", PAYLOAD_RELATIVE_PATH),
  path.resolve(process.cwd(), "..", PAYLOAD_RELATIVE_PATH),
] as const;

let cachedPayload: SiteContentPayload | null = null;

function parsePayloadFromPath(payloadPath: string): SiteContentPayload | null {
  let parsed: Partial<SiteContentPayload> | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = fs.readFileSync(payloadPath, "utf8");
    try {
      parsed = JSON.parse(raw) as Partial<SiteContentPayload>;
      break;
    } catch (error) {
      const isUnexpectedEnd =
        error instanceof SyntaxError &&
        error.message.includes("Unexpected end of JSON input");
      if (!isUnexpectedEnd || attempt === 2) {
        return null;
      }
    }
  }

  if (!parsed) return null;
  if (!parsed.home || !parsed.shop || !parsed.productPage || !parsed.support || !parsed.policies) {
    return null;
  }

  return parsed as SiteContentPayload;
}

function readPayload(): SiteContentPayload {
  if (cachedPayload) return cachedPayload;

  const existingCandidates = GENERATED_PAYLOAD_CANDIDATES.filter((candidate) =>
    fs.existsSync(candidate),
  );
  for (const candidate of existingCandidates) {
    const parsed = parsePayloadFromPath(candidate);
    if (parsed) {
      cachedPayload = parsed;
      return parsed;
    }
  }

  if (existingCandidates.length === 0) {
    throw new Error(
      `Missing generated site-content payload. Checked: ${GENERATED_PAYLOAD_CANDIDATES.join(", ")}. Run startup-loop materializer before starting the app.`,
    );
  }
  throw new Error(
    `Invalid generated site-content payload. Checked: ${existingCandidates.join(", ")}.`,
  );
}

function localizedText(value: LocalizedText, locale: Locale): string {
  return value[locale] ?? value.en;
}

function localizedList(values: LocalizedText[], locale: Locale): string[] {
  return values.map((value) => localizedText(value, locale));
}

export function getHomeContent(locale: Locale) {
  const payload = readPayload();
  const home = payload.home;

  return {
    eyebrow: localizedText(home.eyebrow, locale),
    heading: localizedText(home.heading, locale),
    summary: localizedText(home.summary, locale),
    ctaPrimary: localizedText(home.ctaPrimary, locale),
    ctaSecondary: localizedText(home.ctaSecondary, locale),
    seoHeading: localizedText(home.seoHeading, locale),
    seoBody: localizedText(home.seoBody, locale),
    faqHeading: localizedText(home.faqHeading, locale),
    faqItems: home.faqItems.map((item) => ({
      question: localizedText(item.question, locale),
      answer: localizedText(item.answer, locale),
    })),
  };
}

export function getShopContent(locale: Locale) {
  const payload = readPayload();
  const shop = payload.shop;

  return {
    eyebrow: localizedText(shop.eyebrow, locale),
    heading: localizedText(shop.heading, locale),
    summary: localizedText(shop.summary, locale),
    trustBullets: localizedList(shop.trustBullets, locale),
  };
}

export function getLaunchFamilyCopy(locale: Locale) {
  const families = readPayload().launchFamilies;
  return {
    "top-handle": {
      label: localizedText(families["top-handle"].label, locale),
      description: localizedText(families["top-handle"].description, locale),
    },
    shoulder: {
      label: localizedText(families.shoulder.label, locale),
      description: localizedText(families.shoulder.description, locale),
    },
    mini: {
      label: localizedText(families.mini.label, locale),
      description: localizedText(families.mini.description, locale),
    },
  };
}

export function getProductPageContent(locale: Locale) {
  const productPage = readPayload().productPage;
  return {
    proofHeading: localizedText(productPage.proofHeading, locale),
    proofBullets: localizedList(productPage.proofBullets, locale),
    relatedHeading: localizedText(productPage.relatedHeading, locale),
  };
}

export function getTrustStripContent(
  locale: Locale,
): { delivery: string; exchange: string; origin: string; securePayment: string } | undefined {
  const productPage = readPayload().productPage;
  if (!productPage.trustStrip) return undefined;
  const ts = productPage.trustStrip;
  return {
    delivery: localizedText(ts.delivery, locale),
    exchange: localizedText(ts.exchange, locale),
    origin: localizedText(ts.origin, locale),
    securePayment: localizedText(ts.securePayment, locale),
  };
}

export function getSupportContent(locale: Locale) {
  const support = readPayload().support;
  return {
    title: localizedText(support.title, locale),
    summary: localizedText(support.summary, locale),
    channels: localizedList(support.channels, locale),
    responseSla: localizedText(support.responseSla, locale),
  };
}

export function getPolicyContent(
  locale: Locale,
  kind: "privacy" | "shipping" | "returns" | "terms",
) {
  const policy = readPayload().policies[kind];
  return {
    title: localizedText(policy.title, locale),
    summary: localizedText(policy.summary, locale),
    bullets: localizedList(policy.bullets, locale),
    notice: policy.notice ? localizedText(policy.notice, locale) : null,
  };
}

const CHROME_EN_DEFAULTS: ChromeContent = {
  header: {
    shop: { en: "Shop" },
    support: { en: "Support" },
    navAriaLabel: { en: "Primary" },
  },
  footer: {
    terms: { en: "Terms" },
    privacy: { en: "Privacy" },
    returnsRefunds: { en: "Returns & Refunds" },
    shipping: { en: "Shipping" },
    support: { en: "Support" },
    copyright: { en: "All rights reserved." },
    sectionAriaLabel: { en: "Footer" },
  },
  consent: {
    message: { en: "We use analytics cookies to understand how visitors interact with our site. See our" },
    privacyLink: { en: "privacy policy" },
    decline: { en: "Decline" },
    accept: { en: "Accept" },
    ariaLabel: { en: "Cookie consent" },
  },
  trust: {
    summary: { en: "Free exchange within 30 days · Delivery estimated at checkout" },
    shippingLink: { en: "Shipping policy" },
    returnsLink: { en: "Returns & exchanges" },
  },
  notifyMe: {
    consent: { en: "I agree to receive a one-time reminder email about this product" },
    genericError: { en: "Something went wrong — please try again." },
    validation: { en: "Please enter your email and consent to receive the reminder." },
    emailLabel: { en: "Email" },
    submit: { en: "Notify me" },
    submitting: { en: "Submitting..." },
    success: { en: "Thank you. We'll email you when this product is available." },
  },
};

export function getChromeContent(locale: Locale) {
  const chrome = readPayload().chrome ?? CHROME_EN_DEFAULTS;
  return {
    header: {
      shop: localizedText(chrome.header.shop, locale),
      support: localizedText(chrome.header.support, locale),
      navAriaLabel: localizedText(chrome.header.navAriaLabel, locale),
    },
    footer: {
      terms: localizedText(chrome.footer.terms, locale),
      privacy: localizedText(chrome.footer.privacy, locale),
      returnsRefunds: localizedText(chrome.footer.returnsRefunds, locale),
      shipping: localizedText(chrome.footer.shipping, locale),
      support: localizedText(chrome.footer.support, locale),
      copyright: localizedText(chrome.footer.copyright, locale),
      sectionAriaLabel: localizedText(chrome.footer.sectionAriaLabel, locale),
    },
    consent: {
      message: localizedText(chrome.consent.message, locale),
      privacyLink: localizedText(chrome.consent.privacyLink, locale),
      decline: localizedText(chrome.consent.decline, locale),
      accept: localizedText(chrome.consent.accept, locale),
      ariaLabel: localizedText(chrome.consent.ariaLabel, locale),
    },
    trust: {
      summary: localizedText(chrome.trust.summary, locale),
      shippingLink: localizedText(chrome.trust.shippingLink, locale),
      returnsLink: localizedText(chrome.trust.returnsLink, locale),
    },
    notifyMe: {
      consent: localizedText(chrome.notifyMe.consent, locale),
      genericError: localizedText(chrome.notifyMe.genericError, locale),
      validation: localizedText(chrome.notifyMe.validation, locale),
      emailLabel: localizedText(chrome.notifyMe.emailLabel, locale),
      submit: localizedText(chrome.notifyMe.submit, locale),
      submitting: localizedText(chrome.notifyMe.submitting, locale),
      success: localizedText(chrome.notifyMe.success, locale),
    },
  };
}

export function getSeoKeywords(): string[] {
  return [...readPayload().seoKeywords];
}

export function getContentSourcePaths(): readonly string[] {
  return [...readPayload().sourcePaths];
}
