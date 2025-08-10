// packages/platform-core/createShop/defaultTaxProviders.ts

/** Supported tax provider identifiers */
export const defaultTaxProviders = ["taxjar"] as const;

export type DefaultTaxProvider = (typeof defaultTaxProviders)[number];
