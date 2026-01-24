/** @jest-environment node */

import { legalBundles } from "@acme/templates";

import { deriveContent } from "../contentDerivation";
import type { DeriveContentInput, LaunchProductInput } from "../types";

let productCounter = 1;
const baseProduct = (overrides?: Partial<LaunchProductInput>): LaunchProductInput => ({
  id: `prod-${productCounter++}`,
  name: "Evergreen Bottle",
  description: "A double-walled bottle that keeps drinks cold for 24 hours.",
  images: ["/img/bottle-1.jpg", "/img/bottle-2.jpg"],
  price: 4200,
  currency: "USD",
  variants: [{ id: "v1", name: "Default", stock: 5 }],
  sizes: ["500ml", "750ml"],
  materials: ["Stainless steel"],
  weight: 0.5,
  dimensions: { width: 8, height: 24, depth: 8, unit: "cm" },
  ...overrides,
});

const buildInput = (overrides?: Partial<DeriveContentInput>): DeriveContentInput => {
  if (!legalBundles.length) {
    throw new Error("Legal bundles missing for test setup.");
  }
  return {
    shop: {
      name: "Aurora Supply",
      slug: "aurora",
      locale: "en",
      currency: "USD",
      description: "Outdoor essentials designed for everyday adventures.",
      contactEmail: "hello@aurora.example",
      supportEmail: "support@aurora.example",
      returnsAddress: "123 Market St, Denver, CO",
    },
    theme: { id: "theme-default" },
    brandKit: {
      logoUrl: "https://cdn.example/logo.png",
      faviconUrl: "https://cdn.example/favicon.png",
      socialImageUrl: "https://cdn.example/social.png",
    },
    products: [baseProduct(), baseProduct({ id: "prod-2", name: "Trail Pack" })],
    commerce: {
      paymentTemplateId: "core.payment.stripe.standard",
      shippingTemplateId: "core.shipping.dhl.standard",
      vatTemplateId: "core.tax.standard",
    },
    compliance: {
      legalBundleId: legalBundles[0].id,
      consentTemplateId: "core.consent.standard",
    },
    seo: {
      title: "Aurora Supply | Online Shop",
      description: "Shop Aurora Supply for premium outdoor gear.",
    },
    ...overrides,
  };
};

const extractText = (value: unknown, locale: string): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && locale in (value as Record<string, string>)) {
    return (value as Record<string, string>)[locale] ?? "";
  }
  return "";
};

describe("deriveContent", () => {
  it("returns zero warnings for complete metadata", () => {
    const input = buildInput();
    const result = deriveContent(input);

    expect(result.warningCount).toBe(0);
    for (const page of result.pages) {
      expect(page.warnings).toHaveLength(0);
    }
  });

  it("omits optional FAQ sections and uses fallbacks when data is missing", () => {
    const base = buildInput();
    const input = buildInput({
      shop: {
        ...base.shop,
        description: undefined,
      },
      products: [
        baseProduct({ sizes: undefined, materials: undefined, variants: [] }),
      ],
    });
    const result = deriveContent(input);

    expect(result.warningCount).toBeGreaterThan(0);

    const faqPage = result.pages.find((page) => page.type === "faq");
    expect(faqPage).toBeDefined();
    const faqBlock = faqPage?.components.find((component) => component.type === "FAQBlock") as
      | { items?: Array<{ question: string }> }
      | undefined;
    const questions = faqBlock?.items?.map((item) => item.question.toLowerCase()) ?? [];
    expect(questions.some((q) => q.includes("size"))).toBe(false);
    expect(questions.some((q) => q.includes("material"))).toBe(false);

    const aboutPage = result.pages.find((page) => page.type === "about");
    const aboutMission = aboutPage?.components.find((component) => component.id === "about-mission");
    const missionText = extractText((aboutMission as { text?: unknown })?.text, input.shop.locale);
    expect(missionText).toContain(input.shop.name);
  });

  it("creates one product page per selected product and populates the category grid", () => {
    const input = buildInput({
      products: [
        baseProduct({ id: "p1", name: "Summit Jacket" }),
        baseProduct({ id: "p2", name: "Summit Boots" }),
        baseProduct({ id: "p3", name: "Summit Gloves" }),
      ],
    });
    const result = deriveContent(input);

    const productPages = result.pages.filter((page) => page.type === "product");
    expect(productPages).toHaveLength(3);

    const category = result.pages.find((page) => page.type === "category");
    const grid = category?.components.find((component) => component.type === "ProductGrid") as
      | { skus?: unknown[] }
      | undefined;
    expect(grid?.skus?.length).toBe(3);
  });

  it("derives content within the SLA window", () => {
    const result = deriveContent(buildInput());
    expect(result.derivationDurationMs).toBeLessThan(10_000);
  });

  it("builds deterministic navigation", () => {
    const result = deriveContent(buildInput());
    expect(result.navigation.header).toEqual([
      { label: "Home", url: "/" },
      { label: "Shop", url: "/shop" },
      { label: "About", url: "/about" },
      { label: "Contact", url: "/contact" },
    ]);
    expect(result.navigation.footer).toEqual([
      { label: "Shipping & Returns", url: "/shipping-returns" },
      { label: "FAQ", url: "/faq" },
      { label: "Terms", url: "/terms" },
      { label: "Privacy", url: "/privacy" },
      { label: "Accessibility", url: "/accessibility" },
    ]);
  });
});
