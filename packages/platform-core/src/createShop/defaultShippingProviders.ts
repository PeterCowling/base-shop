// packages/platform-core/createShop/defaultShippingProviders.ts

/** Supported shipping provider identifiers */
export const defaultShippingProviders = [
  "dhl",
  "ups",
  "premier-shipping",
] as const;

export type DefaultShippingProvider = (typeof defaultShippingProviders)[number];
