// Single-purpose: public API to resolve a preview image by type

import { bind,carouselContainer, dataset, genericSection, gridContainer, multiColumn, repeater, stackFlex, tabsAccordionContainer } from "./generators/containers";
import { footerSection, footerSectionLegalHeavy,footerSectionMultiColumn, footerSectionNewsletter, footerSectionSimple, footerSectionSocial } from "./generators/footers";
import { headerSection, headerSectionCenterLogo, headerSectionMinimal, headerSectionSplitUtilities, headerSectionSticky,headerSectionTransparent } from "./generators/headers";
import { analyticsPixelsSection,announcementBar, blogListing, collectionList, consentSection, contactForm, contactFormWithMap, countdownTimer, currencySelector, faqBlock, featuredProduct, formBuilderBlock, gallery, giftCardBlock, heroBanner, imageSlider, lookbook, mapBlock, newsletter, popupModal, pricingTable, productBundle, productCarousel, productComparison, productFilter, productGrid, rentalAvailabilitySection, rentalTermsSection, searchBar, socialFeed, socialLinks, socialProof, storeLocatorBlock, structuredDataSection, tabs, testimonials, valueProps, videoBlock } from "./generators/sections";
import type { } from "./types";

const GENERATORS: Record<string, () => string> = {
  // Containers
  Section: genericSection,
  MultiColumn: multiColumn,
  StackFlex: stackFlex,
  Grid: gridContainer,
  CarouselContainer: carouselContainer,
  TabsAccordionContainer: tabsAccordionContainer,
  Dataset: dataset,
  Repeater: repeater,
  Bind: bind,

  // Organisms / sections
  AnnouncementBar: announcementBar,
};

Object.assign(GENERATORS, {
  HeroBanner: heroBanner,
  ValueProps: valueProps,
  ReviewsCarousel: productCarousel,
  ProductGrid: productGrid,
  ProductCarousel: productCarousel,
  RecommendationCarousel: productCarousel,
  FeaturedProduct: featuredProduct,
  ImageSlider: imageSlider,
  CollectionList: collectionList,
  Gallery: gallery,
  Lookbook: lookbook,
  ContactForm: contactForm,
  ContactFormWithMap: contactFormWithMap,
  BlogListing: blogListing,
  Testimonials: testimonials,
  TestimonialSlider: testimonials,
  MapBlock: mapBlock,
  StoreLocatorBlock: storeLocatorBlock,
  VideoBlock: videoBlock,
  FAQBlock: faqBlock,
  CountdownTimer: countdownTimer,
  SocialLinks: socialLinks,
  SocialFeed: socialFeed,
  SocialProof: socialProof,
  NewsletterSignup: newsletter,
  SearchBar: searchBar,
  PricingTable: pricingTable,
  Tabs: tabs,
  ProductComparison: productComparison,
  GiftCardBlock: giftCardBlock,
  FormBuilderBlock: formBuilderBlock,
  PopupModal: popupModal,
  ProductBundle: productBundle,
  ProductFilter: productFilter,
  CurrencySelector: currencySelector,
  RentalAvailabilitySection: rentalAvailabilitySection,
  RentalTermsSection: rentalTermsSection,
  StructuredDataSection: structuredDataSection,
  ConsentSection: consentSection,
  AnalyticsPixelsSection: analyticsPixelsSection,
});

// Header variants
Object.assign(GENERATORS, {
  HeaderSection: headerSection,
  "HeaderSection:minimal": headerSectionMinimal,
  "HeaderSection:centerLogo": headerSectionCenterLogo,
  "HeaderSection:splitUtilities": headerSectionSplitUtilities,
  "HeaderSection:transparent": headerSectionTransparent,
  "HeaderSection:sticky": headerSectionSticky,
});

// Footer variants
Object.assign(GENERATORS, {
  FooterSection: footerSection,
  "FooterSection:simple": footerSectionSimple,
  "FooterSection:multiColumn": footerSectionMultiColumn,
  "FooterSection:newsletter": footerSectionNewsletter,
  "FooterSection:social": footerSectionSocial,
  "FooterSection:legalHeavy": footerSectionLegalHeavy,
});

export function getPalettePreview(type: string): string {
  const gen = GENERATORS[type];
  if (gen) return gen();
  const base = type.includes(":") ? type.split(":")[0] : type;
  const baseGen = GENERATORS[base];
  if (baseGen) return baseGen();
  return genericSection();
}
