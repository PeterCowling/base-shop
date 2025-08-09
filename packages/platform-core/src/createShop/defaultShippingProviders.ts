// packages/platform-core/createShop/defaultShippingProviders.ts

/** Supported shipping provider identifiers */
export const defaultShippingProviders = ["dhl", "ups"] as const;

export type DefaultShippingProvider = (typeof defaultShippingProviders)[number];
