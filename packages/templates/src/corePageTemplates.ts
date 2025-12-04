import enMessages from "@acme/i18n/en.json";
import type { TemplateDescriptor } from "@acme/page-builder-core";

// Core page-level templates used by CMS configurator and shop scaffolding.
// These descriptors are intentionally minimal and focus on block layout;
// shops should treat them as starting points and customise copy/content.

const t = (key: keyof typeof enMessages): string => enMessages[key] ?? key;

export const corePageTemplates: TemplateDescriptor[] = [
  {
    id: "core.page.home.default",
    version: "1.0.0",
    kind: "page",
    label: "Default home", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Hero with CTA, value props, and a featured products grid for a marketing-focused home page.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Commerce",
    pageType: "marketing",
    previewImage: "/templates/home-default.svg",
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
    id: "core.page.home.editorial",
    version: "1.0.0",
    kind: "page",
    label: "Editorial home", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Hero with story-led copy and curated tiles for campaign landings.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Hero",
    pageType: "marketing",
    previewImage: "/templates/home-editorial.svg",
    components: [
      {
        id: "hero-editorial",
        type: "HeroBanner",
        slides: [
          {
            src: "/images/hero-placeholder.jpg",
            alt: "Hero image", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: placeholder alt text; tracked for later i18n
            headlineKey: "home.editorial.hero.headline",
            ctaKey: "home.editorial.hero.cta",
          },
        ],
      },
      {
        id: "promo-tiles",
        type: "PromoTilesSection",
        density: "editorial",
        tiles: [
          { imageSrc: "/a.jpg", caption: "Campaign A", /* i18n-exempt seed */ ctaLabel: "See more", ctaHref: "/collections/a" },
          { imageSrc: "/b.jpg", caption: "Editorial", /* i18n-exempt seed */ ctaLabel: "Story", ctaHref: "/stories/editorial" },
          { imageSrc: "/c.jpg", caption: "Collection", /* i18n-exempt seed */ ctaLabel: "Shop", ctaHref: "/collections/new" },
        ],
      },
      {
        id: "social-proof",
        type: "SocialProof",
        logos: [
          { src: "/logos/press1.svg" },
          { src: "/logos/press2.svg" },
          { src: "/logos/press3.svg" },
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
    id: "core.page.home.holiday",
    version: "1.0.0",
    kind: "page",
    label: "Holiday home", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Seasonal hero, gift finder, and promo grid for holiday campaigns.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Hero",
    pageType: "marketing",
    previewImage: "/templates/home-holiday.svg",
    components: [
      {
        id: "hero-holiday",
        type: "HeroBanner",
        slides: [
          {
            src: "/images/hero-placeholder.jpg",
            alt: "Holiday hero", // i18n-exempt -- placeholder alt
            headlineKey: "home.holiday.hero.headline",
            ctaKey: "home.holiday.hero.cta",
          },
        ],
      },
      {
        id: "gift-finder",
        type: "GuidedSellingSection",
        outputMode: "inline",
      },
      {
        id: "holiday-promos",
        type: "PromoTilesSection",
        density: "utilitarian",
        tiles: [
          { imageSrc: "/a.jpg", caption: t("templates.holiday.promos.giftsUnder50"), ctaHref: "/collections/gifts-under-50" },
          { imageSrc: "/b.jpg", caption: t("templates.holiday.promos.bundleAndSave"), ctaHref: "/collections/bundles" },
          { imageSrc: "/c.jpg", caption: t("templates.holiday.promos.lastMinute"), ctaHref: "/collections/express" },
        ],
      },
      {
        id: "holiday-grid",
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
    previewImage: "/templates/shop-grid.svg",
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
    id: "core.page.shop.lookbook",
    version: "1.0.0",
    kind: "page",
    label: "Lookbook shop", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Lookbook-style shop with hero panel and curated product clusters.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Commerce",
    pageType: "marketing",
    previewImage: "/templates/shop-lookbook.svg",
    components: [
      {
        id: "shop-hero",
        type: "HeroBanner",
        slides: [
          {
            src: "/images/hero-placeholder.jpg",
            alt: "Lookbook hero", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: placeholder alt text; tracked for later i18n
            headlineKey: "shop.lookbook.headline",
            ctaKey: "shop.lookbook.cta",
          },
        ],
      },
      {
        id: "shop-grid-featured",
        type: "ProductGrid",
        mode: "collection",
        quickView: true,
      },
      {
        id: "shop-grid-secondary",
        type: "ProductGrid",
        mode: "collection",
        quickView: true,
      },
    ],
    origin: "core",
  },
  {
    id: "core.page.shop.services",
    version: "1.0.0",
    kind: "page",
    label: t("templates.shop.services.label"),
    description: t("templates.shop.services.description"),
    category: "Commerce",
    pageType: "marketing",
    previewImage: "/templates/shop-services.svg",
    components: [
      {
        id: "services-hero",
        type: "HeroBanner",
        slides: [
          {
            src: "/images/hero-placeholder.jpg",
            alt: t("templates.shop.services.heroAlt"),
            headlineKey: "shop.services.headline",
            ctaKey: "shop.services.cta",
          },
        ],
      },
      {
        id: "services-grid",
        type: "ProductGrid",
        mode: "collection",
        quickView: false,
      },
      {
        id: "services-cta",
        type: "Callout",
        title: { en: t("templates.shop.services.callout.title") },
        ctaLabel: { en: t("templates.shop.services.callout.cta") },
        ctaHref: "/book",
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
      "PDP layout with media gallery, details, and related products grid.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Commerce",
    pageType: "marketing",
    previewImage: "/templates/product-default.svg",
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
    id: "core.page.product.lifestyle",
    version: "1.0.0",
    kind: "page",
    label: "Lifestyle PDP", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template label; tracked for later i18n
    description:
      "Editorial PDP with immersive gallery, story, and related grid.", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core template description; tracked for later i18n
    category: "Commerce",
    pageType: "marketing",
    previewImage: "/templates/product-lifestyle.svg",
    components: [
      {
        id: "pdp-media",
        type: "ImageSlider",
        slides: [
          { id: "slide-1", src: "/images/hero-placeholder.jpg", alt: t("templates.product.lifestyle.slideAlt") },
        ],
      },
      {
        id: "pdp-details-luxury",
        type: "PDPDetailsSection",
        preset: "luxury",
      },
      {
        id: "pdp-story",
        type: "Text",
        text: { en: t("templates.product.lifestyle.storyPlaceholder") },
      },
      {
        id: "pdp-related",
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
    previewImage: "/templates/checkout-shell.svg",
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
