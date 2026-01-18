"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coreBlockDescriptors = void 0;
/**
 * Core block descriptors shared between CMS and runtime.
 *
 * This initial set focuses on the commonly used marketing and commerce
 * blocks that are rendered by both the CMS and the template app. Further
 * block types and metadata can be added incrementally as PB work evolves.
 */
exports.coreBlockDescriptors = [
    // Commerce & product‑centric blocks
    {
        type: "ProductGrid",
        label: "Product grid", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "ProductCarousel",
        label: "Product carousel", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "RecommendationCarousel",
        label: "Recommendations", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "FeaturedProduct",
        label: "Featured product", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "ProductBundle",
        label: "Product bundle", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "ProductComparison",
        label: "Product comparison", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "ProductFilter",
        label: "Product filter", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "CollectionList",
        label: "Collection list", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
        features: { supportsProducts: true },
    },
    {
        type: "PricingTable",
        label: "Pricing table", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
    },
    {
        type: "GiftCardBlock",
        label: "Gift card", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Commerce",
    },
    // Media‑heavy and hero/section blocks
    {
        type: "HeroBanner",
        label: "Hero banner", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Hero",
        features: { supportsMedia: true },
    },
    {
        type: "Gallery",
        label: "Gallery", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Media",
        features: { supportsMedia: true },
    },
    {
        type: "Image",
        label: "Image", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Media",
        features: { supportsMedia: true },
    },
    {
        type: "VideoBlock",
        label: "Video", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Media",
        features: { supportsMedia: true },
    },
    // Content and storytelling blocks
    {
        type: "ValueProps",
        label: "Value props", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Content",
    },
    {
        type: "BlogListing",
        label: "Blog listing", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Content",
    },
    {
        type: "Testimonials",
        label: "Testimonials", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "SocialProof",
    },
    {
        type: "ReviewsCarousel",
        label: "Reviews carousel", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "SocialProof",
        features: { supportsMedia: true },
    },
    {
        type: "TestimonialSlider",
        label: "Testimonial slider", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "SocialProof",
        features: { supportsMedia: true },
    },
    {
        type: "FAQBlock",
        label: "FAQ", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Content",
    },
    {
        type: "Text",
        label: "Text", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Content",
    },
    {
        type: "CustomHtml",
        label: "Custom HTML", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Content",
    },
    // Layout and containers
    {
        type: "Section",
        label: "Section", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Layout",
    },
    {
        type: "MultiColumn",
        label: "Multi column", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Layout",
    },
    {
        type: "Tabs",
        label: "Tabs", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Layout",
    },
    {
        type: "Header",
        label: "Header", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Layout",
    },
    {
        type: "Footer",
        label: "Footer", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Layout",
    },
    // Forms and interactions
    {
        type: "ContactForm",
        label: "Contact form", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Forms",
    },
    {
        type: "ContactFormWithMap",
        label: "Contact form with map", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Forms",
        features: { supportsMedia: true },
    },
    {
        type: "NewsletterSignup",
        label: "Newsletter signup", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Forms",
    },
    {
        type: "FormBuilderBlock",
        label: "Form builder", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Forms",
    },
    {
        type: "SearchBar",
        label: "Search bar", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Forms",
    },
    {
        type: "Button",
        label: "Button", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Content",
    },
    // Utility and chrome
    {
        type: "AnnouncementBar",
        label: "Announcement bar", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Chrome",
    },
    {
        type: "CountdownTimer",
        label: "Countdown timer", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Chrome",
    },
    {
        type: "HeaderCart",
        label: "Header cart", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Chrome",
        features: { supportsProducts: true },
    },
    {
        type: "SocialLinks",
        label: "Social links", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Social",
    },
    {
        type: "SocialFeed",
        label: "Social feed", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Social",
        features: { supportsMedia: true },
    },
    {
        type: "SocialProof",
        label: "Social proof", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Social",
    },
    {
        type: "MapBlock",
        label: "Map", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Media",
        features: { supportsMedia: true },
    },
    {
        type: "PopupModal",
        label: "Popup modal", // i18n-exempt -- CMS-9999 [ttl=2026-12-31]: core PB block label; tracked for later i18n
        category: "Overlay",
    },
];
