// Public surface for template catalog and helpers.
// Template descriptors and scaffolding helpers should be exported from here
// so apps and CMS code never reach into internal src/** paths.
export const version = "0.0.0-dev";

export {
  // Additional page template groups
  aboutPageTemplates,
  accessibilityPageTemplates,
  // Core template groups
  checkoutPageTemplates,
  cookiePageTemplates,
  corePageTemplates,
  faqPageTemplates,
  homePageTemplates,
  // Legal & Compliance templates (LAUNCH-27)
  legalPageTemplates,
  privacyPageTemplates,
  productPageTemplates,
  returnsPageTemplates,
  shippingReturnsPageTemplates,
  shopPageTemplates,
  termsPageTemplates,
  vatPageTemplates,
} from "./corePageTemplates";

// Provider templates (LAUNCH-28 + LAUNCH-14)
export {
  allProviderTemplates,
  getDirectorApprovedTemplates,
  getProviderTemplate,
  getProviderTemplatesByCategory,
  getProviderTemplatesByProvider,
  paymentProviderTemplates,
  type ProviderTemplate,
  providerTemplateSchema,
  shippingProviderTemplates,
  taxProviderTemplates,
  validateProviderTemplate,
} from "./providerTemplates";
