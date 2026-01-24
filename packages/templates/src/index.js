// Public surface for template catalog and helpers.
// Template descriptors and scaffolding helpers should be exported from here
// so apps and CMS code never reach into internal src/** paths.
export const version = "0.0.0-dev";
// Core template groups + legal bundles.
export { aboutPageTemplates, accessibilityPageTemplates, checkoutPageTemplates, contactPageTemplates, cookiePageTemplates, corePageTemplates, faqPageTemplates, getRapidLaunchLegalBundles, homePageTemplates, legalBundles, legalPageTemplates, pickRapidLaunchLegalBundle, privacyPageTemplates, productPageTemplates, returnsPageTemplates, shippingReturnsPageTemplates, shopPageTemplates, termsPageTemplates, vatPageTemplates, } from "./corePageTemplates";
// Provider templates (LAUNCH-28 + LAUNCH-14)
export { allProviderTemplates, getDirectorApprovedTemplates, getProviderTemplate, getProviderTemplatesByCategory, getProviderTemplatesByProvider, getRapidLaunchTemplates, paymentProviderTemplates, pickRapidLaunchTemplate, providerTemplateSchema, shippingProviderTemplates, taxProviderTemplates, validateProviderTemplate, } from "./providerTemplates";
