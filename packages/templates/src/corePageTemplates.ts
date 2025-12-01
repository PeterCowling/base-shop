import type { TemplateDescriptor } from "@acme/page-builder-core";

// Core page-level templates used by CMS configurator and shop scaffolding.
// These descriptors are intentionally minimal and focus on block layout;
// shops should treat them as starting points and customise copy/content.

export const corePageTemplates: TemplateDescriptor[] = [
  {
    id: "core.page.home.default",
    version: "1.0.0",
    kind: "page",
    label: "Default home", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Hero, value props, and featured products for a marketing-focused home page.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Hero",
    pageType: "marketing",
    components: [
      {
        id: "hero",
        type: "HeroBanner",
        slides: [
          {
            src: "/images/hero-placeholder.jpg",
            alt: "Hero image", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: placeholder alt text; tracked for later i18n
            headlineKey: "home.hero.headline",
            ctaKey: "home.hero.cta",
          },
        ],
      },
      {
        id: "value-props",
        type: "ValueProps",
        items: [
          {
            icon: "shipping-fast",
            title: "Fast delivery", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template copy; tracked for later i18n
            desc: "Get your order in 2–3 days.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template copy; tracked for later i18n
          },
          {
            icon: "returns",
            title: "Easy returns", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template copy; tracked for later i18n
            desc: "30-day hassle-free returns.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template copy; tracked for later i18n
          },
          {
            icon: "support",
            title: "Human support", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template copy; tracked for later i18n
            desc: "Real people ready to help.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template copy; tracked for later i18n
          },
        ],
      },
      {
        id: "home-grid",
        type: "ProductGrid",
        mode: "collection",
        quickView: true,
      },
    ],
    origin: "core",
  },
  {
    id: "core.page.shop.grid",
    version: "1.0.0",
    kind: "page",
    label: "Catalogue grid", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Grid-first product listing page suitable for category or shop routes.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Commerce",
    pageType: "marketing",
    components: [
      {
        id: "shop-grid",
        type: "ProductGrid",
        mode: "collection",
        quickView: true,
      },
    ],
    origin: "core",
  },
  {
    id: "core.page.product.default",
    version: "1.0.0",
    kind: "page",
    label: "Product detail", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Product detail layout with gallery and details section suitable for PDP routes.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Commerce",
    pageType: "marketing",
    components: [
      {
        id: "pdp-details",
        type: "PDPDetailsSection",
        preset: "default",
      },
      {
        id: "pdp-grid-related",
        type: "ProductGrid",
        mode: "collection",
        quickView: true,
      },
    ],
    origin: "core",
  },
  {
    id: "core.page.checkout.shell",
    version: "1.0.0",
    kind: "page",
    label: "Checkout shell", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Checkout-focused page shell with cart summary and payment section.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "System",
    pageType: "marketing",
    components: [
      {
        id: "checkout-section",
        type: "CheckoutSection",
        showWallets: true,
        showBNPL: true,
      },
      {
        id: "checkout-cart",
        type: "CartSection",
        showPromo: true,
        showGiftCard: true,
        showLoyalty: true,
      },
    ],
    origin: "core",
  },
] satisfies TemplateDescriptor[];

export const homePageTemplates: TemplateDescriptor[] = corePageTemplates.filter(
  (tpl) => tpl.id.startsWith("core.page.home."),
);

export const shopPageTemplates: TemplateDescriptor[] = corePageTemplates.filter(
  (tpl) => tpl.id.startsWith("core.page.shop."),
);

export const productPageTemplates: TemplateDescriptor[] =
  corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.product."));

export const checkoutPageTemplates: TemplateDescriptor[] =
  corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.checkout."));
