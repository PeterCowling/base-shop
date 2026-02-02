import type { ConfiguratorStepId } from "./configurator";

export const REQUIRED_CONFIG_CHECK_STEPS: ConfiguratorStepId[] = [
  "shop-basics",
  "theme",
  "payments",
  "shipping-tax",
  "checkout",
  "products-inventory",
  "legal",
  "navigation-home",
];

export const OPTIONAL_CONFIG_CHECK_STEPS: ConfiguratorStepId[] = [
  "domains",
  "reverse-logistics",
  "advanced-seo",
  "reach-social",
];
