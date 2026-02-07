import { ulid } from "ulid";

import type { PageComponent } from "@acme/types";

import type { BuiltInSection } from "./types";
/**
 * Returns translated non-header/footer section variants for the Section Library.
 * Only top-level labels/descriptions are localized here; seed content inside
 * `build()` remains minimal and can be localized at render time.
 */
export function getOtherSections(t: (key: string) => string): BuiltInSection[] {
  return [
    ...getCampaignHeroSections(t),
    ...getPromoTileSections(t),
    ...getShowcaseSections(t),
    ...getComplianceSections(t),
    ...getRentalSections(t),
    ...getSocialSections(t),
    ...getPdpSections(t),
    ...getGuidedSellingSections(t),
    ...getCheckoutSections(t),
    ...getStoreSections(t),
    ...getReferralSections(t),
    ...getAccountSections(t),
  ];
}

function getCampaignHeroSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:CampaignHeroSection:image",
      label: t("pb.sections.CampaignHeroSection.image.label"),
      description: t("pb.sections.CampaignHeroSection.image.description"),
      preview: "/window.svg",
      previewType: "CampaignHeroSection:image",
      build: () =>
        ({
          id: ulid(),
          type: "CampaignHeroSection",
          mediaType: "image",
          imageSrc: "/placeholder-hero.jpg",
          usps: [
            t("pb.seeds.campaignHero.usps.freeShipping"),
            t("pb.seeds.campaignHero.usps.returns30d"),
            t("pb.seeds.campaignHero.usps.carbonNeutral"),
          ],
        } satisfies PageComponent),
    },
    {
      id: "builtin:CampaignHeroSection:video",
      label: t("pb.sections.CampaignHeroSection.video.label"),
      description: t("pb.sections.CampaignHeroSection.video.description"),
      preview: "/window.svg",
      previewType: "CampaignHeroSection:video",
      build: () =>
        ({
          id: ulid(),
          type: "CampaignHeroSection",
          mediaType: "video",
          videoSrc: "/promo.mp4",
        } satisfies PageComponent),
    },
  ];
}

function getPromoTileSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:PromoTilesSection:editorial",
      label: t("pb.sections.PromoTilesSection.editorial.label"),
      description: t("pb.sections.PromoTilesSection.editorial.description"),
      preview: "/window.svg",
      previewType: "PromoTilesSection:editorial",
      build: () =>
        ({
          id: ulid(),
          type: "PromoTilesSection",
          density: "editorial",
          tiles: [
            {
              imageSrc: "/a.jpg",
              caption: "New In",
              /* i18n-exempt seed */ ctaLabel: "Shop",
              /* i18n-exempt seed */ ctaHref: "/collections/new",
            },
            {
              imageSrc: "/b.jpg",
              caption: "Best Sellers",
              /* i18n-exempt seed */ ctaLabel: "Explore",
              /* i18n-exempt seed */ ctaHref: "/collections/best",
            },
            {
              imageSrc: "/c.jpg",
              caption: "Clearance",
              /* i18n-exempt seed */ ctaLabel: "Save now",
              /* i18n-exempt seed */ ctaHref: "/collections/sale",
            },
          ],
        } satisfies PageComponent),
    },
    {
      id: "builtin:PromoTilesSection:utilitarian",
      label: t("pb.sections.PromoTilesSection.utilitarian.label"),
      description: t("pb.sections.PromoTilesSection.utilitarian.description"),
      preview: "/window.svg",
      previewType: "PromoTilesSection:utilitarian",
      build: () =>
        ({
          id: ulid(),
          type: "PromoTilesSection",
          density: "utilitarian",
          tiles: [
            { imageSrc: "/a.jpg", caption: "Men", /* i18n-exempt seed */ ctaHref: "/collections/men" },
            { imageSrc: "/b.jpg", caption: "Women", /* i18n-exempt seed */ ctaHref: "/collections/women" },
          ],
        } satisfies PageComponent),
    },
  ];
}

function getShowcaseSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:ShowcaseSection:featured",
      label: t("pb.sections.ShowcaseSection.featured.label"),
      description: t("pb.sections.ShowcaseSection.featured.description"),
      preview: "/window.svg",
      previewType: "ShowcaseSection:featured",
      build: () =>
        ({
          id: ulid(),
          type: "ShowcaseSection",
          preset: "featured",
          layout: "carousel",
          limit: 12,
        } satisfies PageComponent),
    },
    {
      id: "builtin:ShowcaseSection:new",
      label: t("pb.sections.ShowcaseSection.new.label"),
      description: t("pb.sections.ShowcaseSection.new.description"),
      preview: "/window.svg",
      previewType: "ShowcaseSection:new",
      build: () =>
        ({
          id: ulid(),
          type: "ShowcaseSection",
          preset: "new",
          layout: "grid",
          gridCols: 3,
          limit: 9,
        } satisfies PageComponent),
    },
    {
      id: "builtin:ShowcaseSection:bestsellers",
      label: t("pb.sections.ShowcaseSection.bestsellers.label"),
      description: t("pb.sections.ShowcaseSection.bestsellers.description"),
      preview: "/window.svg",
      previewType: "ShowcaseSection:bestsellers",
      build: () =>
        ({
          id: ulid(),
          type: "ShowcaseSection",
          preset: "bestsellers",
          layout: "carousel",
          limit: 12,
        } satisfies PageComponent),
    },
    {
      id: "builtin:ShowcaseSection:clearance",
      label: t("pb.sections.ShowcaseSection.clearance.label"),
      description: t("pb.sections.ShowcaseSection.clearance.description"),
      preview: "/window.svg",
      previewType: "ShowcaseSection:clearance",
      build: () =>
        ({
          id: ulid(),
          type: "ShowcaseSection",
          preset: "clearance",
          layout: "grid",
          gridCols: 4,
          limit: 8,
        } satisfies PageComponent),
    },
    {
      id: "builtin:ShowcaseSection:limited",
      label: t("pb.sections.ShowcaseSection.limited.label"),
      description: t("pb.sections.ShowcaseSection.limited.description"),
      preview: "/window.svg",
      previewType: "ShowcaseSection:limited",
      build: () =>
        ({
          id: ulid(),
          type: "ShowcaseSection",
          preset: "limited",
          layout: "carousel",
          limit: 8,
        } satisfies PageComponent),
    },
  ];
}

function getComplianceSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:ConsentSection",
      label: t("pb.sections.ConsentSection.label"),
      description: t("pb.sections.ConsentSection.description"),
      preview: "/window.svg",
      previewType: "ConsentSection",
      build: () => ({ id: ulid(), type: "ConsentSection" } satisfies PageComponent),
    },
    {
      id: "builtin:AnalyticsPixelsSection",
      label: t("pb.sections.AnalyticsPixelsSection.label"),
      description: t("pb.sections.AnalyticsPixelsSection.description"),
      preview: "/window.svg",
      previewType: "AnalyticsPixelsSection",
      build: () => ({ id: ulid(), type: "AnalyticsPixelsSection" } satisfies PageComponent),
    },
    {
      id: "builtin:StructuredDataSection",
      label: t("pb.sections.StructuredDataSection.label"),
      description: t("pb.sections.StructuredDataSection.description"),
      preview: "/window.svg",
      previewType: "StructuredDataSection",
      build: () => ({ id: ulid(), type: "StructuredDataSection", breadcrumbs: true } satisfies PageComponent),
    },
  ];
}

function getRentalSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:RentalAvailabilitySection",
      label: t("pb.sections.RentalAvailabilitySection.label"),
      description: t("pb.sections.RentalAvailabilitySection.description"),
      preview: "/window.svg",
      previewType: "RentalAvailabilitySection",
      build: () => ({ id: ulid(), type: "RentalAvailabilitySection", sku: "sku_123" } satisfies PageComponent),
    },
    {
      id: "builtin:RentalTermsSection",
      label: t("pb.sections.RentalTermsSection.label"),
      description: t("pb.sections.RentalTermsSection.description"),
      preview: "/window.svg",
      previewType: "RentalTermsSection",
      build: () => ({
        id: ulid(),
        type: "RentalTermsSection",
        sku: "sku_123",
        termsVersion: "1.0",
      } satisfies PageComponent),
    },
  ];
}

function getSocialSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:SocialProof:logos",
      label: t("pb.sections.SocialProof.logos.label"),
      description: t("pb.sections.SocialProof.logos.description"),
      preview: "/window.svg",
      previewType: "SocialProof:logos",
      build: () => ({
        id: ulid(),
        type: "SocialProof",
        logos: [{ src: "/logos/press1.svg" }, { src: "/logos/press2.svg" }, { src: "/logos/press3.svg" }],
      } satisfies PageComponent),
    },
    {
      id: "builtin:CrossSellSection:default",
      label: t("pb.sections.CrossSellSection.default.label"),
      description: t("pb.sections.CrossSellSection.default.description"),
      preview: "/window.svg",
      previewType: "CrossSellSection:default",
      build: () => ({
        id: ulid(),
        type: "CrossSellSection",
        rules: { onlyInStock: true },
        layout: "grid",
      } satisfies PageComponent),
    },
  ];
}

function getPdpSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:PDP:Policies",
      label: t("pb.sections.PDP.Policies.label"),
      description: t("pb.sections.PDP.Policies.description"),
      preview: "/window.svg",
      previewType: "PDP:Policies",
      build: () =>
        ({
          id: ulid(),
          type: "PoliciesAccordion",
          shipping: t("pb.seeds.policies.shippingHtml"),
          returns: t("pb.seeds.policies.returnsHtml"),
          warranty: t("pb.seeds.policies.warrantyHtml"),
        } satisfies PageComponent),
    },
    {
      id: "builtin:PDP:StickyBuyBar",
      label: t("pb.sections.PDP.StickyBuyBar.label"),
      description: t("pb.sections.PDP.StickyBuyBar.description"),
      preview: "/window.svg",
      previewType: "PDP:StickyBuyBar",
      build: () => ({ id: ulid(), type: "StickyBuyBar" } satisfies PageComponent),
    },
    {
      id: "builtin:PDP:Financing",
      label: t("pb.sections.PDP.Financing.label"),
      description: t("pb.sections.PDP.Financing.description"),
      preview: "/window.svg",
      previewType: "PDP:Financing",
      build: () => ({
        id: ulid(),
        type: "FinancingBadge",
        provider: "klarna",
        apr: 0,
        termMonths: 12,
      } satisfies PageComponent),
    },
    {
      id: "builtin:PDP:DetailsLuxury",
      label: t("pb.sections.PDP.DetailsLuxury.label"),
      description: t("pb.sections.PDP.DetailsLuxury.description"),
      preview: "/window.svg",
      previewType: "PDP:DetailsLuxury",
      build: () => ({ id: ulid(), type: "PDPDetailsSection", preset: "luxury" } satisfies PageComponent),
    },
  ];
}

function getGuidedSellingSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:GuidedSellingSection:default",
      label: t("pb.sections.GuidedSellingSection.default.label"),
      description: t("pb.sections.GuidedSellingSection.default.description"),
      preview: "/window.svg",
      previewType: "GuidedSellingSection:default",
      build: () => ({ id: ulid(), type: "GuidedSellingSection", outputMode: "inline" } satisfies PageComponent),
    },
  ];
}

function getCheckoutSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:CartSection:default",
      label: t("pb.sections.CartSection.default.label"),
      description: t("pb.sections.CartSection.default.description"),
      preview: "/window.svg",
      previewType: "CartSection:default",
      build: () =>
        ({
          id: ulid(),
          type: "CartSection",
          showPromo: true,
          showGiftCard: true,
          showLoyalty: false,
        } satisfies PageComponent),
    },
    {
      id: "builtin:CheckoutSection:default",
      label: t("pb.sections.CheckoutSection.default.label"),
      description: t("pb.sections.CheckoutSection.default.description"),
      preview: "/window.svg",
      previewType: "CheckoutSection:default",
      build: () =>
        ({
          id: ulid(),
          type: "CheckoutSection",
          showWallets: true,
          showBNPL: true,
        } satisfies PageComponent),
    },
    {
      id: "builtin:ThankYouSection:recs",
      label: t("pb.sections.ThankYouSection.recs.label"),
      description: t("pb.sections.ThankYouSection.recs.description"),
      preview: "/window.svg",
      previewType: "ThankYouSection:recs",
      build: () => ({
        id: ulid(),
        type: "ThankYouSection",
        recommendationPreset: "featured",
      } satisfies PageComponent),
    },
  ];
}

function getStoreSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:StoreLocatorSection:default",
      label: t("pb.sections.StoreLocatorSection.default.label"),
      description: t("pb.sections.StoreLocatorSection.default.description"),
      preview: "/window.svg",
      previewType: "StoreLocatorSection:default",
      build: () => ({
        id: ulid(),
        type: "StoreLocatorSection",
        enableGeolocation: true,
        emitLocalBusiness: false,
      } satisfies PageComponent),
    },
  ];
}

function getReferralSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:EmailReferralSection:giveget",
      label: t("pb.sections.EmailReferralSection.giveget.label"),
      description: t("pb.sections.EmailReferralSection.giveget.description"),
      preview: "/window.svg",
      previewType: "EmailReferralSection:giveget",
      build: () =>
        ({
          id: ulid(),
          type: "EmailReferralSection",
          headline: t("pb.seeds.emailReferral.headline"),
          subtitle: t("pb.seeds.emailReferral.subtitle"),
          giveLabel: t("pb.seeds.emailReferral.giveLabel"),
          getLabel: t("pb.seeds.emailReferral.getLabel"),
        } satisfies PageComponent),
    },
  ];
}

function getAccountSections(t: (key: string) => string): BuiltInSection[] {
  return [
    {
      id: "builtin:DSARSection:default",
      label: t("pb.sections.DSARSection.default.label"),
      description: t("pb.sections.DSARSection.default.description"),
      preview: "/window.svg",
      previewType: "DSARSection:default",
      build: () => ({ id: ulid(), type: "DSARSection" } satisfies PageComponent),
    },
    {
      id: "builtin:AgeGateSection:18",
      label: t("pb.sections.AgeGateSection.18.label"),
      description: t("pb.sections.AgeGateSection.18.description"),
      preview: "/window.svg",
      previewType: "AgeGateSection:18",
      build: () =>
        ({
          id: ulid(),
          type: "AgeGateSection",
          minAge: 18,
          rememberDays: 30,
        } satisfies PageComponent),
    },
    {
      id: "builtin:AccountSection:default",
      label: t("pb.sections.AccountSection.default.label"),
      description: t("pb.sections.AccountSection.default.description"),
      preview: "/window.svg",
      previewType: "AccountSection:default",
      build: () =>
        ({
          id: ulid(),
          type: "AccountSection",
          showDashboard: true,
          showOrders: true,
          showRentals: true,
          showAddresses: true,
          showPayments: true,
        } satisfies PageComponent),
    },
    {
      id: "builtin:RentalManageSection:default",
      label: t("pb.sections.RentalManageSection.default.label"),
      description: t("pb.sections.RentalManageSection.default.description"),
      preview: "/window.svg",
      previewType: "RentalManageSection:default",
      build: () => ({ id: ulid(), type: "RentalManageSection" } satisfies PageComponent),
    },
  ];
}
