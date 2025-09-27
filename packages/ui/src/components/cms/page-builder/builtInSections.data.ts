import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";

/* i18n-exempt file -- PB-221: Built-in Section Library seed labels/descriptions are editor scaffolding, not end-user copy; CMS/i18n overrides at render time. */

// Built-in section variants surfaced in the Section Library selector.
// Each entry returns a concrete PageComponent for insertion.

export type BuiltInSection = {
  id: string;
  label: string;
  description?: string;
  // Always keep this as "/window.svg" so the selector uses our generated preview
  preview: string;
  // Encodes the base type and variant key understood by getPalettePreview
  previewType: string;
  build: () => PageComponent;
};

const headerVariants: BuiltInSection[] = [
  {
    id: "builtin:HeaderSection:minimal",
    label: "Header — Minimal",
    description: "Compact header with inline search",
    preview: "/window.svg",
    previewType: "HeaderSection:minimal",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "minimal", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
  },
  {
    id: "builtin:HeaderSection:centerLogo",
    label: "Header — Center Logo",
    description: "Centered logo with utilities",
    preview: "/window.svg",
    previewType: "HeaderSection:centerLogo",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "centerLogo", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
  },
  {
    id: "builtin:HeaderSection:splitUtilities",
    label: "Header — Split Utilities",
    description: "Nav and utilities split",
    preview: "/window.svg",
    previewType: "HeaderSection:splitUtilities",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "splitUtilities", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
  },
  {
    id: "builtin:HeaderSection:transparent",
    label: "Header — Transparent",
    description: "Overlay header on hero",
    preview: "/window.svg",
    previewType: "HeaderSection:transparent",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "transparent", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
  },
  {
    id: "builtin:HeaderSection:sticky",
    label: "Header — Sticky",
    description: "Sticks to top on scroll",
    preview: "/window.svg",
    previewType: "HeaderSection:sticky",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "sticky", searchMode: "inline", announcement: false, showBreadcrumbs: false, showCurrencySelector: false, showLocaleSelector: false } satisfies PageComponent),
  },
];

const footerVariants: BuiltInSection[] = [
  {
    id: "builtin:FooterSection:simple",
    label: "Footer — Simple",
    description: "Single-row footer",
    preview: "/window.svg",
    previewType: "FooterSection:simple",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "simple" } satisfies PageComponent),
  },
  {
    id: "builtin:FooterSection:multiColumn",
    label: "Footer — Multi-Column",
    description: "Four-column footer",
    preview: "/window.svg",
    previewType: "FooterSection:multiColumn",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "multiColumn" } satisfies PageComponent),
  },
  {
    id: "builtin:FooterSection:newsletter",
    label: "Footer — Newsletter",
    description: "Footer with subscribe form",
    preview: "/window.svg",
    previewType: "FooterSection:newsletter",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "newsletter" } satisfies PageComponent),
  },
  {
    id: "builtin:FooterSection:social",
    label: "Footer — Social",
    description: "Centered social links",
    preview: "/window.svg",
    previewType: "FooterSection:social",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "social" } satisfies PageComponent),
  },
  {
    id: "builtin:FooterSection:legalHeavy",
    label: "Footer — Legal",
    description: "Legal-focused footer",
    preview: "/window.svg",
    previewType: "FooterSection:legalHeavy",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "legalHeavy" } satisfies PageComponent),
  },
];

const otherSections: BuiltInSection[] = [
  {
    id: "builtin:CampaignHeroSection:image",
    label: "Campaign Hero — Image",
    description: "Hero with optional hotspots and countdown",
    preview: "/window.svg",
    previewType: "CampaignHeroSection:image",
    build: () => ({ id: ulid(), type: "CampaignHeroSection", mediaType: "image", imageSrc: "/placeholder-hero.jpg", usps: ["Free shipping", "30-day returns", "Carbon neutral" ] } satisfies PageComponent),
  },
  {
    id: "builtin:CampaignHeroSection:video",
    label: "Campaign Hero — Video",
    description: "Autoplay looped video hero",
    preview: "/window.svg",
    previewType: "CampaignHeroSection:video",
    build: () => ({ id: ulid(), type: "CampaignHeroSection", mediaType: "video", videoSrc: "/promo.mp4" } satisfies PageComponent),
  },
  {
    id: "builtin:PromoTilesSection:editorial",
    label: "Promo Tiles — Editorial",
    description: "Large tiles with captions/CTAs",
    preview: "/window.svg",
    previewType: "PromoTilesSection:editorial",
    build: () => ({ id: ulid(), type: "PromoTilesSection", density: "editorial", tiles: [ { imageSrc: "/a.jpg", caption: "New In", ctaLabel: "Shop", ctaHref: "/collections/new" }, { imageSrc: "/b.jpg", caption: "Best Sellers", ctaLabel: "Explore", ctaHref: "/collections/best" }, { imageSrc: "/c.jpg", caption: "Clearance", ctaLabel: "Save now", ctaHref: "/collections/sale" } ] } satisfies PageComponent),
  },
  {
    id: "builtin:PromoTilesSection:utilitarian",
    label: "Promo Tiles — Utilitarian",
    description: "Compact tiles for quick links",
    preview: "/window.svg",
    previewType: "PromoTilesSection:utilitarian",
    build: () => ({ id: ulid(), type: "PromoTilesSection", density: "utilitarian", tiles: [ { imageSrc: "/a.jpg", caption: "Men", ctaHref: "/collections/men" }, { imageSrc: "/b.jpg", caption: "Women", ctaHref: "/collections/women" } ] } satisfies PageComponent),
  },
  {
    id: "builtin:ShowcaseSection:featured",
    label: "Showcase — Featured (Carousel)",
    description: "Curated featured products",
    preview: "/window.svg",
    previewType: "ShowcaseSection:featured",
    build: () => ({ id: ulid(), type: "ShowcaseSection", preset: "featured", layout: "carousel", limit: 12 } satisfies PageComponent),
  },
  {
    id: "builtin:ShowcaseSection:new",
    label: "Showcase — New (Grid)",
    description: "New arrivals grid",
    preview: "/window.svg",
    previewType: "ShowcaseSection:new",
    build: () => ({ id: ulid(), type: "ShowcaseSection", preset: "new", layout: "grid", gridCols: 3, limit: 9 } satisfies PageComponent),
  },
  {
    id: "builtin:ShowcaseSection:bestsellers",
    label: "Showcase — Bestsellers",
    description: "Top sellers carousel",
    preview: "/window.svg",
    previewType: "ShowcaseSection:bestsellers",
    build: () => ({ id: ulid(), type: "ShowcaseSection", preset: "bestsellers", layout: "carousel", limit: 12 } satisfies PageComponent),
  },
  {
    id: "builtin:ShowcaseSection:clearance",
    label: "Showcase — Clearance",
    description: "Low price items",
    preview: "/window.svg",
    previewType: "ShowcaseSection:clearance",
    build: () => ({ id: ulid(), type: "ShowcaseSection", preset: "clearance", layout: "grid", gridCols: 4, limit: 8 } satisfies PageComponent),
  },
  {
    id: "builtin:ShowcaseSection:limited",
    label: "Showcase — Limited",
    description: "Limited/exclusive picks",
    preview: "/window.svg",
    previewType: "ShowcaseSection:limited",
    build: () => ({ id: ulid(), type: "ShowcaseSection", preset: "limited", layout: "carousel", limit: 8 } satisfies PageComponent),
  },
  {
    id: "builtin:ConsentSection",
    label: "Consent Banner",
    description: "Cookie consent prompt",
    preview: "/window.svg",
    previewType: "ConsentSection",
    build: () => ({ id: ulid(), type: "ConsentSection" } satisfies PageComponent),
  },
  {
    id: "builtin:AnalyticsPixelsSection",
    label: "Analytics (GA4)",
    description: "Loads GA4 after consent",
    preview: "/window.svg",
    previewType: "AnalyticsPixelsSection",
    build: () => ({ id: ulid(), type: "AnalyticsPixelsSection" } satisfies PageComponent),
  },
  {
    id: "builtin:StructuredDataSection",
    label: "Structured Data — Breadcrumbs",
    description: "Injects BreadcrumbList JSON-LD",
    preview: "/window.svg",
    previewType: "StructuredDataSection",
    build: () => ({ id: ulid(), type: "StructuredDataSection", breadcrumbs: true } satisfies PageComponent),
  },
  {
    id: "builtin:RentalAvailabilitySection",
    label: "Rental — Availability",
    description: "Check rental dates availability",
    preview: "/window.svg",
    previewType: "RentalAvailabilitySection",
    build: () => ({ id: ulid(), type: "RentalAvailabilitySection", sku: "sku_123" } satisfies PageComponent),
  },
  {
    id: "builtin:RentalTermsSection",
    label: "Rental — Terms",
    description: "Accept terms, insurance, deposit",
    preview: "/window.svg",
    previewType: "RentalTermsSection",
    build: () => ({ id: ulid(), type: "RentalTermsSection", sku: "sku_123", termsVersion: "1.0" } satisfies PageComponent),
  },
  {
    id: "builtin:SocialProof:logos",
    label: "Social Proof — Logos",
    description: "Certification/press logo wall",
    preview: "/window.svg",
    previewType: "SocialProof:logos",
    build: () => ({ id: ulid(), type: "SocialProof", logos: [ { src: "/logos/press1.svg" }, { src: "/logos/press2.svg" }, { src: "/logos/press3.svg" } ] } satisfies PageComponent),
  },
  {
    id: "builtin:CrossSellSection:default",
    label: "Cross-Sell — Default",
    description: "You may also like",
    preview: "/window.svg",
    previewType: "CrossSellSection:default",
    build: () => ({ id: ulid(), type: "CrossSellSection", rules: { onlyInStock: true }, layout: "grid" } satisfies PageComponent),
  },
  {
    id: "builtin:PDP:Policies",
    label: "PDP — Policies",
    description: "Shipping/Returns/Warranty accordion",
    preview: "/window.svg",
    previewType: "PDP:Policies",
    build: () => ({ id: ulid(), type: "PoliciesAccordion", shipping: "<p>Free shipping over $50</p>", returns: "<p>30-day returns</p>", warranty: "<p>2-year limited warranty</p>" } satisfies PageComponent),
  },
  {
    id: "builtin:PDP:StickyBuyBar",
    label: "PDP — Sticky Buy Bar",
    description: "Bottom sticky add-to-cart bar",
    preview: "/window.svg",
    previewType: "PDP:StickyBuyBar",
    build: () => ({ id: ulid(), type: "StickyBuyBar" } satisfies PageComponent),
  },
  {
    id: "builtin:PDP:Financing",
    label: "PDP — Financing Badge",
    description: "Monthly pricing badge",
    preview: "/window.svg",
    previewType: "PDP:Financing",
    build: () => ({ id: ulid(), type: "FinancingBadge", provider: "klarna", apr: 0, termMonths: 12 } satisfies PageComponent),
  },
  {
    id: "builtin:PDP:DetailsLuxury",
    label: "PDP — Luxury Details",
    description: "Spacious editorial layout for details",
    preview: "/window.svg",
    previewType: "PDP:DetailsLuxury",
    build: () => ({ id: ulid(), type: "PDPDetailsSection", preset: "luxury" } satisfies PageComponent),
  },
  {
    id: "builtin:GuidedSellingSection:default",
    label: "Guided Selling — Default",
    description: "Multi-step finder (inline results)",
    preview: "/window.svg",
    previewType: "GuidedSellingSection:default",
    build: () => ({ id: ulid(), type: "GuidedSellingSection", outputMode: "inline" } satisfies PageComponent),
  },
  {
    id: "builtin:CartSection:default",
    label: "Cart — Default",
    description: "Cart with promo/gift/loyalty",
    preview: "/window.svg",
    previewType: "CartSection:default",
    build: () => ({ id: ulid(), type: "CartSection", showPromo: true, showGiftCard: true, showLoyalty: false } satisfies PageComponent),
  },
  {
    id: "builtin:CheckoutSection:default",
    label: "Checkout — Default",
    description: "Checkout form wrapper",
    preview: "/window.svg",
    previewType: "CheckoutSection:default",
    build: () => ({ id: ulid(), type: "CheckoutSection", showWallets: true, showBNPL: true } satisfies PageComponent),
  },
  {
    id: "builtin:ThankYouSection:recs",
    label: "Thank You — With Recs",
    description: "Confirmation + recommendations",
    preview: "/window.svg",
    previewType: "ThankYouSection:recs",
    build: () => ({ id: ulid(), type: "ThankYouSection", recommendationPreset: "featured" } satisfies PageComponent),
  },
  {
    id: "builtin:StoreLocatorSection:default",
    label: "Store Locator — Default",
    description: "List + map with geolocation",
    preview: "/window.svg",
    previewType: "StoreLocatorSection:default",
    build: () => ({ id: ulid(), type: "StoreLocatorSection", enableGeolocation: true, emitLocalBusiness: false } satisfies PageComponent),
  },
  {
    id: "builtin:EmailReferralSection:giveget",
    label: "Email Referral — Give/Get",
    description: "Inline band with give/get copy",
    preview: "/window.svg",
    previewType: "EmailReferralSection:giveget",
    build: () => ({ id: ulid(), type: "EmailReferralSection", headline: "Give $10, Get $10", subtitle: "Invite a friend and both get rewarded.", giveLabel: "$10 for them", getLabel: "$10 for you" } satisfies PageComponent),
  },
  {
    id: "builtin:DSARSection:default",
    label: "DSAR — Data Requests",
    description: "Export/delete request UI",
    preview: "/window.svg",
    previewType: "DSARSection:default",
    build: () => ({ id: ulid(), type: "DSARSection" } satisfies PageComponent),
  },
  {
    id: "builtin:AgeGateSection:18",
    label: "Age Gate — 18+",
    description: "Overlay age confirmation",
    preview: "/window.svg",
    previewType: "AgeGateSection:18",
    build: () => ({ id: ulid(), type: "AgeGateSection", minAge: 18, rememberDays: 30 } satisfies PageComponent),
  },
  {
    id: "builtin:AccountSection:default",
    label: "Account — Dashboard",
    description: "Cards for orders/rentals/addresses/payments",
    preview: "/window.svg",
    previewType: "AccountSection:default",
    build: () => ({ id: ulid(), type: "AccountSection", showDashboard: true, showOrders: true, showRentals: true, showAddresses: true, showPayments: true } satisfies PageComponent),
  },
  {
    id: "builtin:RentalManageSection:default",
    label: "Account — Manage Rental",
    description: "Extend/return manager",
    preview: "/window.svg",
    previewType: "RentalManageSection:default",
    build: () => ({ id: ulid(), type: "RentalManageSection" } satisfies PageComponent),
  },
];

export const builtInSections: BuiltInSection[] = [
  ...headerVariants,
  ...footerVariants,
  ...otherSections,
];
