import { type LegalBundle,legalBundles } from "@acme/templates";
import type { NavItem } from "@acme/types";

import type { DeriveContentInput, DerivedPage } from "../types";

import { deriveAboutPage } from "./about";
import { deriveCategoryPage } from "./category";
import { deriveContactPage } from "./contact";
import { deriveFaqPage } from "./faq";
import { buildSkus } from "./helpers";
import { deriveHomePage } from "./home";
import { deriveLegalPages } from "./legal";
import { deriveProductPages } from "./product";
import { deriveShippingReturnsPage } from "./shippingReturns";

function resolveLegalBundle(input: DeriveContentInput): { bundle: LegalBundle; warning?: string } {
  const bundle = legalBundles.find((candidate) => candidate.id === input.compliance.legalBundleId);
  if (bundle) return { bundle };
  if (legalBundles.length === 0) {
    throw new Error("No legal bundles are configured.");
  }
  return {
    bundle: legalBundles[0],
    warning: `Legal bundle "${input.compliance.legalBundleId}" not found; falling back to ${legalBundles[0].id}.`,
  };
}

export function deriveNavigation(pages: DerivedPage[]): { header: NavItem[]; footer: NavItem[] } {
  const byType = new Map(pages.map((page) => [page.type, page]));

  const header: NavItem[] = [
    { label: "Home", url: byType.get("home")?.slug ?? "/" },
    { label: "Shop", url: byType.get("category")?.slug ?? "/shop" },
    { label: "About", url: byType.get("about")?.slug ?? "/about" },
    { label: "Contact", url: byType.get("contact")?.slug ?? "/contact" },
  ];

  const footer: NavItem[] = [
    { label: "Shipping & Returns", url: byType.get("shipping-returns")?.slug ?? "/shipping-returns" },
    { label: "FAQ", url: byType.get("faq")?.slug ?? "/faq" },
    { label: "Terms", url: byType.get("terms")?.slug ?? "/terms" },
    { label: "Privacy", url: byType.get("privacy")?.slug ?? "/privacy" },
    { label: "Accessibility", url: byType.get("accessibility")?.slug ?? "/accessibility" },
  ];

  return { header, footer };
}

export function derivePages(input: DeriveContentInput): { pages: DerivedPage[]; navigation: { header: NavItem[]; footer: NavItem[] } } {
  const { skus, byId } = buildSkus(input.products);
  const { bundle, warning } = resolveLegalBundle(input);

  const home = deriveHomePage(input, skus);
  const category = deriveCategoryPage(input, skus);
  const products = deriveProductPages(input, skus, byId);
  const about = deriveAboutPage(input);
  const contact = deriveContactPage(input);
  const faq = deriveFaqPage(input);
  const shippingReturns = deriveShippingReturnsPage(input, bundle);
  const legalPages = deriveLegalPages(input, bundle);

  if (warning) {
    shippingReturns.warnings.push(warning);
    for (const page of legalPages) {
      page.warnings.push(warning);
    }
  }

  const pages = [home, category, ...products, about, contact, faq, shippingReturns, ...legalPages];
  const navigation = deriveNavigation(pages);

  return { pages, navigation };
}
