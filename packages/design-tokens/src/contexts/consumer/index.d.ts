/**
 * Consumer context tokens
 * Optimized for marketing, e-commerce, content-heavy interfaces
 * Used in: Product shops, marketing sites, public-facing pages
 */
export declare const consumerTokens: {
    readonly spacing: {
        readonly 'row-gap': "1.5rem";
        readonly 'section-gap': "3rem";
        readonly 'card-padding': "1.5rem";
        readonly 'input-padding': "1rem";
        readonly 'button-padding-x': "1.5rem";
        readonly 'button-padding-y': "0.75rem";
    };
    readonly typography: {
        readonly 'base-size': "1rem";
        readonly 'heading-size': "1.5rem";
        readonly 'label-size': "0.875rem";
        readonly 'hero-size': "3rem";
    };
    readonly colors: {
        readonly 'brand-primary': "#2563eb";
        readonly 'brand-secondary': "#3b82f6";
        readonly accent: "#16a34a";
        readonly 'price-default': "#111827";
        readonly 'price-sale': "#dc2626";
        readonly 'price-original': "#6b7280";
        readonly 'badge-new': "#16a34a";
        readonly 'badge-sale': "#dc2626";
        readonly 'badge-featured': "#9333ea";
    };
    readonly density: "comfortable";
};
export type ConsumerTokens = typeof consumerTokens;
