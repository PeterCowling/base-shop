/** Supported payment provider identifiers */
export declare const defaultPaymentProviders: readonly ["stripe", "paypal"];
export type DefaultPaymentProvider = (typeof defaultPaymentProviders)[number];
