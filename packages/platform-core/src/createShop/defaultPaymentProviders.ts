// packages/platform-core/createShop/defaultPaymentProviders.ts

/** Supported payment provider identifiers */
export const defaultPaymentProviders = ["stripe", "paypal"] as const;

export type DefaultPaymentProvider = (typeof defaultPaymentProviders)[number];
