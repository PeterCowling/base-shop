import * as fs from "node:fs";
import * as path from "node:path";

import type { Locale } from "@acme/i18n/locales";

interface LocalizedText {
  en: string;
  de?: string;
  it?: string;
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
  };
  support: {
    title: LocalizedText;
    summary: LocalizedText;
    channels: LocalizedText[];
    responseSla: LocalizedText;
  };
  policies: Record<"privacy" | "shipping" | "returns" | "terms", PolicyCopy>;
}

const GENERATED_PAYLOAD_PATH = path.resolve(
  process.cwd(),
  "data/shops/caryina/site-content.generated.json",
);

let cachedPayload: SiteContentPayload | null = null;

function readPayload(): SiteContentPayload {
  if (cachedPayload) return cachedPayload;

  if (!fs.existsSync(GENERATED_PAYLOAD_PATH)) {
    throw new Error(
      `Missing generated site-content payload at ${GENERATED_PAYLOAD_PATH}. Run startup-loop materializer before starting the app.`,
    );
  }

  const raw = fs.readFileSync(GENERATED_PAYLOAD_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<SiteContentPayload>;

  if (!parsed.home || !parsed.shop || !parsed.productPage || !parsed.support || !parsed.policies) {
    throw new Error(
      `Invalid generated site-content payload at ${GENERATED_PAYLOAD_PATH}: required top-level blocks are missing.`,
    );
  }

  cachedPayload = parsed as SiteContentPayload;
  return cachedPayload;
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

export function getSeoKeywords(): string[] {
  return [...readPayload().seoKeywords];
}

export function getContentSourcePaths(): readonly string[] {
  return [...readPayload().sourcePaths];
}
