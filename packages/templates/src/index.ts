// Public surface for template catalog and helpers.
// Template descriptors and scaffolding helpers should be exported from here
// so apps and CMS code never reach into internal src/** paths.
export const version = "0.0.0-dev";

export {
  corePageTemplates,
  homePageTemplates,
  shopPageTemplates,
  productPageTemplates,
  checkoutPageTemplates,
} from "./corePageTemplates";
