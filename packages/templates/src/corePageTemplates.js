import enMessages from "@acme/i18n/en.json";
// Core page-level templates used by CMS configurator and shop scaffolding.
// These descriptors are intentionally minimal and focus on block layout;
// shops should treat them as starting points and customise copy/content.
//
// Standards: See docs/cms/content-template-standards.md for naming conventions,
// ID patterns, i18n rules, and category assignments.
const t = (key) => enMessages[key] ?? key;
export const corePageTemplates = [
    {
        id: "core.page.home.default",
        version: "1.0.0",
        kind: "page",
        label: "Default home", // i18n-exempt -- TPL-001: template metadata
        description: "Hero with CTA, value props, and a featured products grid for a marketing-focused home page.", // i18n-exempt -- TPL-001: template metadata
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
                        alt: "Hero image", // i18n-exempt -- TPL-001: placeholder alt
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
                        title: "Fast delivery", // i18n-exempt -- TPL-001: placeholder content
                        desc: "Get your order in 2–3 days.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        icon: "returns",
                        title: "Easy returns", // i18n-exempt -- TPL-001: placeholder content
                        desc: "30-day hassle-free returns.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        icon: "support",
                        title: "Human support", // i18n-exempt -- TPL-001: placeholder content
                        desc: "Real people ready to help.", // i18n-exempt -- TPL-001: placeholder content
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
        label: "Editorial home", // i18n-exempt -- TPL-001: template metadata
        description: "Hero with story-led copy and curated tiles for campaign landings.", // i18n-exempt -- TPL-001: template metadata
        category: "Hero",
        pageType: "marketing",
        previewImage: "/templates/home-editorial.svg",
        components: [
            {
                id: "hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Hero image", // i18n-exempt -- TPL-001: placeholder alt
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
                    { imageSrc: "/a.jpg", caption: "Campaign A", ctaLabel: "See more", ctaHref: "/collections/a" }, // i18n-exempt -- TPL-001: placeholder content
                    { imageSrc: "/b.jpg", caption: "Editorial", ctaLabel: "Story", ctaHref: "/stories/editorial" }, // i18n-exempt -- TPL-001: placeholder content
                    { imageSrc: "/c.jpg", caption: "Collection", ctaLabel: "Shop", ctaHref: "/collections/new" }, // i18n-exempt -- TPL-001: placeholder content
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
        label: "Holiday home", // i18n-exempt -- TPL-001: template metadata
        description: "Seasonal hero, gift finder, and promo grid for holiday campaigns.", // i18n-exempt -- TPL-001: template metadata
        category: "Hero",
        pageType: "marketing",
        previewImage: "/templates/home-holiday.svg",
        components: [
            {
                id: "hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Holiday hero", // i18n-exempt -- TPL-001: placeholder alt
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
        label: "Catalogue grid", // i18n-exempt -- TPL-001: template metadata
        description: "Grid-first product listing page suitable for category or shop routes.", // i18n-exempt -- TPL-001: template metadata
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
        label: "Lookbook shop", // i18n-exempt -- TPL-001: template metadata
        description: "Lookbook-style shop with hero panel and curated product clusters.", // i18n-exempt -- TPL-001: template metadata
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
                        alt: "Lookbook hero", // i18n-exempt -- TPL-001: placeholder alt
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
        label: "Services shop", // i18n-exempt -- TPL-001: template metadata
        description: "Service-forward layout with hero, packages grid, and booking CTA.", // i18n-exempt -- TPL-001: template metadata
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
        label: "Product detail", // i18n-exempt -- TPL-001: template metadata
        description: "PDP layout with media gallery, details, and related products grid.", // i18n-exempt -- TPL-001: template metadata
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
        label: "Lifestyle PDP", // i18n-exempt -- TPL-001: template metadata
        description: "Editorial PDP with immersive gallery, story, and related grid.", // i18n-exempt -- TPL-001: template metadata
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
                id: "pdp-details",
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
        label: "Checkout shell", // i18n-exempt -- TPL-001: template metadata
        description: "Checkout-focused page shell with cart summary and payment section.", // i18n-exempt -- TPL-001: template metadata
        category: "System",
        pageType: "marketing",
        previewImage: "/templates/checkout-shell.svg",
        components: [
            {
                id: "checkout-main",
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
    {
        id: "core.page.about.default",
        version: "1.0.0",
        kind: "page",
        label: "About page", // i18n-exempt -- TPL-001: template metadata
        description: "Company about page with hero, mission statement, and team section.", // i18n-exempt -- TPL-001: template metadata
        category: "Features",
        pageType: "marketing",
        previewImage: "/templates/about-default.svg",
        components: [
            {
                id: "about-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "About us hero", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "about.hero.headline",
                        ctaKey: "about.hero.cta",
                    },
                ],
            },
            {
                id: "about-mission",
                type: "Text",
                text: { en: "At {{shopName}}, our mission is to provide exceptional products and service to our customers." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "about-values",
                type: "ValueProps",
                items: [
                    {
                        icon: "heart",
                        title: "Customer first", // i18n-exempt -- TPL-001: placeholder content
                        desc: "We put our customers at the heart of everything we do.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        icon: "leaf",
                        title: "Sustainability", // i18n-exempt -- TPL-001: placeholder content
                        desc: "Committed to environmentally responsible practices.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        icon: "sparkles",
                        title: "Quality", // i18n-exempt -- TPL-001: placeholder content
                        desc: "Only the finest materials and craftsmanship.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "about-contact-cta",
                type: "Callout",
                title: { en: "Get in touch" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact us" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.contact.default",
        version: "1.0.0",
        kind: "page",
        label: "Contact page", // i18n-exempt -- TPL-001: template metadata
        description: "Contact page with hero, contact details, and a simple contact form.", // i18n-exempt -- TPL-001: template metadata
        category: "Features",
        pageType: "marketing",
        previewImage: "/templates/contact-default.svg",
        components: [
            {
                id: "contact-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Contact us hero", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "contact.hero.headline",
                        ctaKey: "contact.hero.cta",
                    },
                ],
            },
            {
                id: "contact-intro",
                type: "Text",
                text: { en: "We'd love to hear from you. Use the form below or reach out via email." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "contact-form",
                type: "ContactForm",
            },
            {
                id: "contact-details",
                type: "Text",
                text: { en: "Support: support@example.com" }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "contact-cta",
                type: "Callout",
                title: { en: "Looking for quick answers?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Visit the FAQ" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/faq",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.faq.default",
        version: "1.0.0",
        kind: "page",
        label: "FAQ page", // i18n-exempt -- TPL-001: template metadata
        description: "Frequently asked questions page with expandable accordion items.", // i18n-exempt -- TPL-001: template metadata
        category: "Features",
        pageType: "marketing",
        previewImage: "/templates/faq-default.svg",
        components: [
            {
                id: "faq-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "FAQ hero", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "faq.hero.headline",
                    },
                ],
            },
            {
                id: "faq-items",
                type: "FAQBlock",
                items: [
                    {
                        question: "How do I place an order?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Browse our products, add items to your cart, and proceed to checkout.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "What payment methods do you accept?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We accept all major credit cards, PayPal, and Apple Pay.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "How can I track my order?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "You will receive a tracking number via email once your order ships.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "What is your return policy?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We offer 30-day returns on all unworn items with original tags.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "faq-contact-cta",
                type: "Callout",
                title: { en: "Still have questions?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact support" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.shipping-returns.default",
        version: "1.0.0",
        kind: "page",
        label: "Shipping & Returns", // i18n-exempt -- TPL-001: template metadata
        description: "Shipping and returns policy page with clear sections for each policy.", // i18n-exempt -- TPL-001: template metadata
        category: "Legal",
        pageType: "legal",
        previewImage: "/templates/shipping-returns-default.svg",
        components: [
            {
                id: "shipping-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Shipping and returns hero", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "shipping.hero.headline",
                    },
                ],
            },
            {
                id: "policies-accordion",
                type: "PoliciesAccordion",
                shipping: "We offer free standard shipping on orders over €50. Standard delivery takes 3-5 business days. Express shipping is available for an additional fee.", // i18n-exempt -- TPL-001: placeholder content
                returns: "Items can be returned within 30 days of delivery. Items must be unworn, unwashed, and have all original tags attached. Refunds are processed within 5-7 business days.", // i18n-exempt -- TPL-001: placeholder content
                warranty: "All products come with a 1-year warranty against manufacturing defects. Contact our support team for warranty claims.", // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "shipping-faq",
                type: "FAQBlock",
                items: [
                    {
                        question: "How long does shipping take?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Do you ship internationally?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Yes, we ship to most countries worldwide. International shipping durations vary by destination.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "How do I return an item?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Log into your account, go to your orders, and select 'Return item'. Follow the instructions to print a return label.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "shipping-contact-cta",
                type: "Callout",
                title: { en: "Need help with shipping or returns?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact us" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact",
            },
        ],
        origin: "core",
    },
    // ============================================================
    // LEGAL & COMPLIANCE TEMPLATES (LAUNCH-27)
    // Director-approved templates for Basic tier shops
    // ============================================================
    {
        id: "core.page.legal.terms.default",
        version: "1.0.0",
        kind: "page",
        label: "Terms of Service", // i18n-exempt -- TPL-001: template metadata
        description: "Standard terms of service page with sections for definitions, user obligations, payments, liability, and governing law.", // i18n-exempt -- TPL-001: template metadata
        category: "Legal",
        pageType: "legal",
        previewImage: "/templates/legal-terms-default.svg",
        components: [
            {
                id: "terms-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Terms of Service", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "legal.terms.hero.headline",
                    },
                ],
            },
            {
                id: "terms-intro",
                type: "Text",
                text: { en: "These Terms of Service govern your use of our website and services. By accessing or using our services, you agree to be bound by these terms." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "terms-sections",
                type: "FAQBlock",
                items: [
                    {
                        question: "1. Definitions", // i18n-exempt -- TPL-001: placeholder content
                        answer: "\"Service\" refers to the website and all services provided. \"User\" refers to any person accessing the Service. \"Content\" refers to all materials available on the Service.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "2. Account Registration", // i18n-exempt -- TPL-001: placeholder content
                        answer: "To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "3. User Obligations", // i18n-exempt -- TPL-001: placeholder content
                        answer: "You agree to use the Service lawfully and not to engage in any activity that interferes with or disrupts the Service. You will not attempt to gain unauthorized access to any systems or networks.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "4. Payments and Refunds", // i18n-exempt -- TPL-001: placeholder content
                        answer: "All prices are displayed in the applicable currency. Payment is due at the time of purchase. Refunds are subject to our Returns Policy.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "5. Intellectual Property", // i18n-exempt -- TPL-001: placeholder content
                        answer: "All content on the Service, including text, graphics, logos, and software, is the property of the company or its licensors and is protected by intellectual property laws.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "6. Limitation of Liability", // i18n-exempt -- TPL-001: placeholder content
                        answer: "To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "7. Governing Law", // i18n-exempt -- TPL-001: placeholder content
                        answer: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the company is registered, without regard to conflict of law principles.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "8. Changes to Terms", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We reserve the right to modify these Terms at any time. Changes will be effective when posted. Continued use of the Service after changes constitutes acceptance.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "terms-contact-cta",
                type: "Callout",
                title: { en: "Questions about our terms?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact us" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.legal.privacy.default",
        version: "1.0.0",
        kind: "page",
        label: "Privacy Policy", // i18n-exempt -- TPL-001: template metadata
        description: "GDPR/CCPA-compliant privacy policy with sections for data collection, usage, sharing, retention, and user rights.", // i18n-exempt -- TPL-001: template metadata
        category: "Legal",
        pageType: "legal",
        previewImage: "/templates/legal-privacy-default.svg",
        components: [
            {
                id: "privacy-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Privacy Policy", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "legal.privacy.hero.headline",
                    },
                ],
            },
            {
                id: "privacy-intro",
                type: "Text",
                text: { en: "This Privacy Policy explains how we collect, use, store, and protect your personal data when you use our website and services. We are committed to protecting your privacy and complying with applicable data protection laws." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "privacy-sections",
                type: "FAQBlock",
                items: [
                    {
                        question: "Who is responsible for your data?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "The data controller is [Company Name]. For privacy inquiries, contact us at [email address].", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "What personal data do we collect?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We collect information you provide directly (name, email, address, payment details) and automatically (IP address, device information, browsing behavior via cookies).", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "How do we use your data?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We use your data to: process orders and payments, communicate with you about your account, improve our services, comply with legal obligations, and with your consent, send marketing communications.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Legal basis for processing (GDPR)", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We process data based on: contract performance, legal obligations, legitimate interests (improving services, fraud prevention), and your consent where required.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Who do we share data with?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We share data with: payment processors, shipping providers, analytics services, and legal authorities when required. We do not sell your personal data.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "How long do we keep your data?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We retain data only as long as necessary for the purposes described, or as required by law. Account data is kept while your account is active. Transaction records are kept for legal compliance periods.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Your rights", // i18n-exempt -- TPL-001: placeholder content
                        answer: "You have the right to: access your data, correct inaccuracies, request deletion, restrict processing, data portability, and withdraw consent. Contact us to exercise these rights.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "International transfers", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Some service providers may process data outside your country. We use appropriate safeguards (standard contractual clauses) for international transfers.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Changes to this policy", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We may update this policy periodically. The latest version will always be available on this page with the effective date.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "privacy-dsar-cta",
                type: "Callout",
                title: { en: "Want to exercise your privacy rights?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Submit a request" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact?subject=privacy",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.legal.cookie.default",
        version: "1.0.0",
        kind: "page",
        label: "Cookie Policy", // i18n-exempt -- TPL-001: template metadata
        description: "Cookie policy explaining what cookies are used, their purposes, and how users can manage preferences (GDPR/CCPA compliant).", // i18n-exempt -- TPL-001: template metadata
        category: "Legal",
        pageType: "legal",
        previewImage: "/templates/legal-cookie-default.svg",
        components: [
            {
                id: "cookie-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Cookie Policy", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "legal.cookie.hero.headline",
                    },
                ],
            },
            {
                id: "cookie-intro",
                type: "Text",
                text: { en: "This Cookie Policy explains how we use cookies and similar technologies on our website. By continuing to use our site, you consent to our use of cookies as described below." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "cookie-sections",
                type: "FAQBlock",
                items: [
                    {
                        question: "What are cookies?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences and improve your experience.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Essential cookies", // i18n-exempt -- TPL-001: placeholder content
                        answer: "These cookies are necessary for the website to function properly. They enable core functionality like security, session management, and shopping cart operations. These cannot be disabled.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Analytics cookies", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We use analytics cookies to understand how visitors interact with our website. This helps us improve our services. Data is aggregated and anonymous where possible.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Marketing cookies", // i18n-exempt -- TPL-001: placeholder content
                        answer: "With your consent, we may use marketing cookies to show relevant advertisements and measure campaign effectiveness. You can opt out at any time.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Third-party cookies", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Some cookies are set by third-party services we use (payment providers, social media, maps). These services have their own privacy policies.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Managing your preferences", // i18n-exempt -- TPL-001: placeholder content
                        answer: "You can manage cookie preferences through our consent banner or your browser settings. Note that blocking some cookies may affect website functionality.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Local storage", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We also use browser local storage for preferences that don't need to be sent to servers (like theme settings). You can clear this via browser settings.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "cookie-contact-cta",
                type: "Callout",
                title: { en: "Questions about cookies?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact us" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.legal.vat.default",
        version: "1.0.0",
        kind: "page",
        label: "VAT & Tax Information", // i18n-exempt -- TPL-001: template metadata
        description: "VAT and tax disclosure page explaining tax handling, invoicing, and jurisdiction-specific requirements (director-approved for Basic tier).", // i18n-exempt -- TPL-001: template metadata
        category: "Legal",
        pageType: "legal",
        previewImage: "/templates/legal-vat-default.svg",
        components: [
            {
                id: "vat-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "VAT & Tax Information", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "legal.vat.hero.headline",
                    },
                ],
            },
            {
                id: "vat-intro",
                type: "Text",
                text: { en: "This page explains how we handle VAT (Value Added Tax) and other applicable taxes on your purchases. Prices and tax treatment may vary based on your location and the products purchased." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "vat-sections",
                type: "FAQBlock",
                items: [
                    {
                        question: "Are prices inclusive or exclusive of VAT?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "For customers in the EU, all displayed prices include VAT at the applicable rate. For customers outside the EU, prices are shown exclusive of any local taxes or duties that may apply on import.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "What VAT rate applies?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "The VAT rate depends on the product category and delivery destination. Standard rates typically range from 19-25% in EU countries. Reduced rates may apply to certain product categories.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "VAT invoices", // i18n-exempt -- TPL-001: placeholder content
                        answer: "A VAT invoice will be included with your order confirmation email. Business customers can request a formal VAT invoice by contacting us with their VAT registration number.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Business customers (B2B)", // i18n-exempt -- TPL-001: placeholder content
                        answer: "If you are a VAT-registered business in the EU, you may be eligible for VAT exemption under the reverse charge mechanism. Please provide your VAT number at checkout.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "International orders", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Orders shipped outside the EU may be subject to import duties and local taxes. These charges are the responsibility of the recipient and are not included in our prices.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Our VAT registration", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Our VAT registration number is [VAT_NUMBER]. Our registered business address is [BUSINESS_ADDRESS].", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "vat-contact-cta",
                type: "Callout",
                title: { en: "Need a VAT invoice or have tax questions?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact us" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact?subject=vat",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.legal.accessibility.default",
        version: "1.0.0",
        kind: "page",
        label: "Accessibility Statement", // i18n-exempt -- TPL-001: template metadata
        description: "Accessibility statement describing WCAG compliance efforts, known issues, and how to report accessibility barriers.", // i18n-exempt -- TPL-001: template metadata
        category: "Legal",
        pageType: "legal",
        previewImage: "/templates/legal-accessibility-default.svg",
        components: [
            {
                id: "accessibility-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Accessibility Statement", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "legal.accessibility.hero.headline",
                    },
                ],
            },
            {
                id: "accessibility-intro",
                type: "Text",
                text: { en: "We are committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "accessibility-sections",
                type: "FAQBlock",
                items: [
                    {
                        question: "Our commitment", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We strive to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. Our team works to ensure our website is perceivable, operable, understandable, and robust for all users.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Measures we take", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We include accessibility as part of our design process, provide text alternatives for images, ensure keyboard navigation, maintain sufficient color contrast, and test with assistive technologies.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Known limitations", // i18n-exempt -- TPL-001: placeholder content
                        answer: "While we strive for full accessibility, some older content or third-party integrations may not yet meet all standards. We are actively working to address these issues.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Assistive technology compatibility", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Our website is designed to be compatible with screen readers, voice recognition software, and other assistive technologies. We test with NVDA, VoiceOver, and JAWS.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Feedback and contact", // i18n-exempt -- TPL-001: placeholder content
                        answer: "If you encounter accessibility barriers or have suggestions for improvement, please contact us. We take all feedback seriously and will work to resolve issues promptly.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Formal complaints", // i18n-exempt -- TPL-001: placeholder content
                        answer: "If you are not satisfied with our response to your accessibility concern, you may escalate to the relevant enforcement body in your jurisdiction.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "accessibility-contact-cta",
                type: "Callout",
                title: { en: "Report an accessibility issue" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact us" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact?subject=accessibility",
            },
        ],
        origin: "core",
    },
    {
        id: "core.page.legal.returns.default",
        version: "1.0.0",
        kind: "page",
        label: "Returns Policy", // i18n-exempt -- TPL-001: template metadata
        description: "Returns and refund policy page with eligibility criteria, process instructions, and refund timelines.", // i18n-exempt -- TPL-001: template metadata
        category: "Legal",
        pageType: "legal",
        previewImage: "/templates/legal-returns-default.svg",
        components: [
            {
                id: "returns-hero",
                type: "HeroBanner",
                slides: [
                    {
                        src: "/images/hero-placeholder.jpg",
                        alt: "Returns Policy", // i18n-exempt -- TPL-001: placeholder alt
                        headlineKey: "legal.returns.hero.headline",
                    },
                ],
            },
            {
                id: "returns-intro",
                type: "Text",
                text: { en: "We want you to be completely satisfied with your purchase. If you're not happy with your order, you can return it within the timeframe specified below." }, // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "returns-policies",
                type: "PoliciesAccordion",
                shipping: "Free standard shipping on orders over €50. Standard delivery: 3-5 business days. Express shipping available for an additional fee.", // i18n-exempt -- TPL-001: placeholder content
                returns: "Items can be returned within 30 days of delivery. Items must be unused, in original packaging, with all tags attached. Sale items may have different return conditions.", // i18n-exempt -- TPL-001: placeholder content
                warranty: "Products come with a 1-year warranty against manufacturing defects. Warranty does not cover normal wear and tear or damage from misuse.", // i18n-exempt -- TPL-001: placeholder content
            },
            {
                id: "returns-faq",
                type: "FAQBlock",
                items: [
                    {
                        question: "How do I start a return?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Log into your account, find your order, and select 'Return items'. Follow the instructions to generate a return label. Pack items securely and drop off at the designated carrier.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "What items cannot be returned?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "For hygiene reasons, certain items cannot be returned once opened: underwear, swimwear, pierced jewelry, and personalized items. Gift cards are non-refundable.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "When will I receive my refund?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Refunds are processed within 5-7 business days of receiving your return. The refund will be credited to your original payment method. Bank processing may add 3-5 additional days.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "Can I exchange an item?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "We don't offer direct exchanges. Please return the unwanted item for a refund and place a new order for the item you want.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        question: "What if my item arrived damaged?", // i18n-exempt -- TPL-001: placeholder content
                        answer: "Contact us within 48 hours of delivery with photos of the damage. We'll arrange a replacement or full refund including shipping costs.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            {
                id: "returns-contact-cta",
                type: "Callout",
                title: { en: "Need help with a return?" }, // i18n-exempt -- TPL-001: placeholder content
                ctaLabel: { en: "Contact support" }, // i18n-exempt -- TPL-001: placeholder content
                ctaHref: "/contact?subject=returns",
            },
        ],
        origin: "core",
    },
];
export const legalBundles = [
    {
        id: "core.legal.bundle.standard",
        name: "Standard Legal Bundle", // i18n-exempt -- TPL-001: template metadata
        approved: true,
        rapidLaunch: true,
        rapidLaunchOrder: 1,
        documents: {
            terms: {
                title: "Terms of Service", // i18n-exempt -- TPL-001: placeholder content
                sections: [
                    {
                        heading: "Definitions", // i18n-exempt -- TPL-001: placeholder content
                        body: "\"Service\" refers to the website and all services provided. \"User\" refers to any person accessing the Service. \"Content\" refers to all materials available on the Service.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Account registration", // i18n-exempt -- TPL-001: placeholder content
                        body: "To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "User obligations", // i18n-exempt -- TPL-001: placeholder content
                        body: "You agree to use the Service lawfully and not to engage in any activity that interferes with or disrupts the Service. You will not attempt to gain unauthorized access to any systems or networks.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Payments and refunds", // i18n-exempt -- TPL-001: placeholder content
                        body: "All prices are displayed in the applicable currency. Payment is due at the time of purchase. Refunds are subject to our Returns Policy.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Intellectual property", // i18n-exempt -- TPL-001: placeholder content
                        body: "All content on the Service, including text, graphics, logos, and software, is the property of the company or its licensors and is protected by intellectual property laws.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Limitation of liability", // i18n-exempt -- TPL-001: placeholder content
                        body: "To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Governing law", // i18n-exempt -- TPL-001: placeholder content
                        body: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the company is registered, without regard to conflict of law principles.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Changes to terms", // i18n-exempt -- TPL-001: placeholder content
                        body: "We reserve the right to modify these Terms at any time. Changes will be effective when posted. Continued use of the Service after changes constitutes acceptance.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            privacy: {
                title: "Privacy Policy", // i18n-exempt -- TPL-001: placeholder content
                sections: [
                    {
                        heading: "Who is responsible for your data?", // i18n-exempt -- TPL-001: placeholder content
                        body: "The data controller is [Company Name]. For privacy inquiries, contact us at [email address].", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "What personal data do we collect?", // i18n-exempt -- TPL-001: placeholder content
                        body: "We collect information you provide directly (name, email, address, payment details) and automatically (IP address, device information, browsing behavior via cookies).", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "How do we use your data?", // i18n-exempt -- TPL-001: placeholder content
                        body: "We use your data to: process orders and payments, communicate with you about your account, improve our services, comply with legal obligations, and with your consent, send marketing communications.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Legal basis for processing (GDPR)", // i18n-exempt -- TPL-001: placeholder content
                        body: "We process data based on: contract performance, legal obligations, legitimate interests (improving services, fraud prevention), and your consent where required.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Who do we share data with?", // i18n-exempt -- TPL-001: placeholder content
                        body: "We share data with: payment processors, shipping providers, analytics services, and legal authorities when required. We do not sell your personal data.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "How long do we keep your data?", // i18n-exempt -- TPL-001: placeholder content
                        body: "We retain data only as long as necessary for the purposes described, or as required by law. Account data is kept while your account is active. Transaction records are kept for legal compliance periods.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Your rights", // i18n-exempt -- TPL-001: placeholder content
                        body: "You have the right to: access your data, correct inaccuracies, request deletion, restrict processing, data portability, and withdraw consent. Contact us to exercise these rights.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "International transfers", // i18n-exempt -- TPL-001: placeholder content
                        body: "Some service providers may process data outside your country. We use appropriate safeguards (standard contractual clauses) for international transfers.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Changes to this policy", // i18n-exempt -- TPL-001: placeholder content
                        body: "We may update this policy periodically. The latest version will always be available on this page with the effective date.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            accessibility: {
                title: "Accessibility Statement", // i18n-exempt -- TPL-001: placeholder content
                sections: [
                    {
                        heading: "Our commitment", // i18n-exempt -- TPL-001: placeholder content
                        body: "We strive to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. Our team works to ensure our website is perceivable, operable, understandable, and robust for all users.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Measures we take", // i18n-exempt -- TPL-001: placeholder content
                        body: "We include accessibility as part of our design process, provide text alternatives for images, ensure keyboard navigation, maintain sufficient color contrast, and test with assistive technologies.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Known limitations", // i18n-exempt -- TPL-001: placeholder content
                        body: "While we strive for full accessibility, some older content or third-party integrations may not yet meet all standards. We are actively working to address these issues.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Assistive technology compatibility", // i18n-exempt -- TPL-001: placeholder content
                        body: "Our website is designed to be compatible with screen readers, voice recognition software, and other assistive technologies. We test with NVDA, VoiceOver, and JAWS.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Feedback and contact", // i18n-exempt -- TPL-001: placeholder content
                        body: "If you encounter accessibility barriers or have suggestions for improvement, please contact us. We take all feedback seriously and will work to resolve issues promptly.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Formal complaints", // i18n-exempt -- TPL-001: placeholder content
                        body: "If you are not satisfied with our response to your accessibility concern, you may escalate to the relevant enforcement body in your jurisdiction.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            returns: {
                title: "Shipping & Returns", // i18n-exempt -- TPL-001: placeholder content
                sections: [
                    {
                        heading: "Shipping", // i18n-exempt -- TPL-001: placeholder content
                        body: "Free standard shipping on orders over €50. Standard delivery: 3-5 business days. Express shipping available for an additional fee.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Returns", // i18n-exempt -- TPL-001: placeholder content
                        body: "Items can be returned within 30 days of delivery. Items must be unused, in original packaging, with all tags attached. Sale items may have different return conditions.", // i18n-exempt -- TPL-001: placeholder content
                    },
                    {
                        heading: "Warranty", // i18n-exempt -- TPL-001: placeholder content
                        body: "Products come with a 1-year warranty against manufacturing defects. Warranty does not cover normal wear and tear or damage from misuse.", // i18n-exempt -- TPL-001: placeholder content
                    },
                ],
            },
            consent: {
                id: "core.consent.standard",
                label: "Standard cookie consent", // i18n-exempt -- TPL-001: placeholder content
                description: "Display a consent banner for analytics and marketing cookies with opt-in controls.", // i18n-exempt -- TPL-001: placeholder content
                regions: ["EU", "UK", "US-CA"],
            },
            vat: {
                id: "core.vat.standard",
                label: "Standard VAT disclosure", // i18n-exempt -- TPL-001: placeholder content
                description: "Prices include VAT where required. VAT invoices available on request.", // i18n-exempt -- TPL-001: placeholder content
                rate: 0.2,
                inclusive: true,
                registrationNumber: "[VAT_NUMBER]",
            },
        },
    },
];
export function getRapidLaunchLegalBundles() {
    const rapid = legalBundles.filter((bundle) => bundle.rapidLaunch);
    if (rapid.length > 0) {
        return [...rapid].sort((a, b) => (a.rapidLaunchOrder ?? Number.POSITIVE_INFINITY) - (b.rapidLaunchOrder ?? Number.POSITIVE_INFINITY));
    }
    if (legalBundles.length > 0) {
        // i18n-exempt -- DS-1234 [ttl=2026-12-31] — developer warning only
        console.warn("[rapid-launch] No legal bundles tagged; falling back to first available.");
    }
    return legalBundles;
}
export function pickRapidLaunchLegalBundle() {
    return getRapidLaunchLegalBundles()[0];
}
export const homePageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.home."));
export const shopPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.shop."));
export const productPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.product."));
export const checkoutPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.checkout."));
export const aboutPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.about."));
export const contactPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.contact."));
export const faqPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.faq."));
export const shippingReturnsPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.shipping-returns."));
// Legal & Compliance template exports (LAUNCH-27)
export const legalPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.legal."));
export const termsPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.legal.terms."));
export const privacyPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.legal.privacy."));
export const cookiePageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.legal.cookie."));
export const vatPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.legal.vat."));
export const accessibilityPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.legal.accessibility."));
export const returnsPageTemplates = corePageTemplates.filter((tpl) => tpl.id.startsWith("core.page.legal.returns."));
