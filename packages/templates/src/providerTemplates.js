/**
 * Provider Templates (LAUNCH-28 + LAUNCH-14)
 *
 * Templates for payment and shipping providers used in shop configuration.
 * These describe provider capabilities, required configuration, and
 * integration requirements for the launch pipeline.
 */
import { z } from "zod";
// ============================================================
// Provider Template Base Schema
// ============================================================
export const providerTemplateSchema = z.object({
    id: z.string(),
    version: z.string(),
    provider: z.string(),
    label: z.string(),
    description: z.string(),
    category: z.enum(["payment", "shipping", "tax"]),
    /** Capabilities this template enables */
    capabilities: z.array(z.string()),
    /** Required environment variables */
    requiredEnvVars: z.array(z.string()),
    /** Optional environment variables */
    optionalEnvVars: z.array(z.string()).optional(),
    /** Required configuration fields in shop config */
    requiredConfig: z.array(z.string()).optional(),
    /** Webhook endpoint path (relative to app root) */
    webhookPath: z.string().optional(),
    /** Documentation URL */
    docsUrl: z.string().url().optional(),
    /** Supported currencies (ISO 4217) */
    supportedCurrencies: z.array(z.string()).optional(),
    /** Supported countries (ISO 3166-1 alpha-2) */
    supportedCountries: z.array(z.string()).optional(),
    /** Director-approved for Basic tier */
    directorApproved: z.boolean().default(false),
    /** Show in rapid-launch wizard */
    rapidLaunch: z.boolean().optional(),
    /** Sort order within rapid-launch wizard */
    rapidLaunchOrder: z.number().int().optional(),
    /** Template origin */
    origin: z.enum(["core", "custom"]).default("core"),
});
// ============================================================
// Payment Provider Templates
// ============================================================
export const paymentProviderTemplates = [
    {
        id: "core.payment.stripe.standard",
        version: "1.0.0",
        provider: "stripe",
        label: "Stripe Standard", // i18n-exempt -- TPL-001: template metadata
        description: "Standard Stripe integration with checkout sessions, webhooks, and card payments. Supports 135+ currencies and most payment methods.", // i18n-exempt -- TPL-001: template metadata
        category: "payment",
        capabilities: [
            "card-payments",
            "checkout-sessions",
            "webhooks",
            "refunds",
            "subscriptions",
            "apple-pay",
            "google-pay",
            "link",
            "klarna",
            "afterpay",
        ],
        requiredEnvVars: [
            "STRIPE_SECRET_KEY",
            "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
            "STRIPE_WEBHOOK_SECRET",
        ],
        optionalEnvVars: [
            "STRIPE_USE_MOCK", // For testing
        ],
        webhookPath: "/api/stripe-webhook",
        docsUrl: "https://stripe.com/docs",
        supportedCurrencies: [
            "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "NOK", "DKK",
            "PLN", "CZK", "HUF", "RON", "BGN", "HRK", "NZD", "SGD", "HKD", "MXN",
        ],
        supportedCountries: [
            "US", "GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH",
            "AU", "NZ", "CA", "JP", "SG", "HK", "SE", "NO", "DK", "FI",
            "IE", "PT", "PL", "CZ", "HU", "RO", "BG", "HR", "SK", "SI",
        ],
        directorApproved: true,
        rapidLaunch: true,
        rapidLaunchOrder: 1,
        origin: "core",
    },
    {
        id: "core.payment.stripe.connect",
        version: "1.0.0",
        provider: "stripe",
        label: "Stripe Connect (Platform)", // i18n-exempt -- TPL-001: template metadata
        description: "Stripe Connect for marketplace/platform setups. Enables split payments, connected accounts, and platform fees.", // i18n-exempt -- TPL-001: template metadata
        category: "payment",
        capabilities: [
            "card-payments",
            "checkout-sessions",
            "webhooks",
            "refunds",
            "connected-accounts",
            "split-payments",
            "platform-fees",
            "apple-pay",
            "google-pay",
        ],
        requiredEnvVars: [
            "STRIPE_SECRET_KEY",
            "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
            "STRIPE_WEBHOOK_SECRET",
            "STRIPE_CONNECT_ACCOUNT_ID", // Connected account ID
        ],
        optionalEnvVars: [
            "STRIPE_PLATFORM_FEE_PERCENT",
            "STRIPE_USE_MOCK",
        ],
        webhookPath: "/api/stripe-webhook",
        docsUrl: "https://stripe.com/docs/connect",
        supportedCurrencies: [
            "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "NOK", "DKK",
        ],
        supportedCountries: [
            "US", "GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH",
            "AU", "NZ", "CA", "JP", "SG", "HK",
        ],
        directorApproved: false, // Requires additional setup
        rapidLaunch: false,
        origin: "core",
    },
    {
        id: "core.payment.paypal.standard",
        version: "1.0.0",
        provider: "paypal",
        label: "PayPal Standard", // i18n-exempt -- TPL-001: template metadata
        description: "PayPal integration with Express Checkout and Smart Payment Buttons. Supports PayPal balance, cards, and local payment methods.", // i18n-exempt -- TPL-001: template metadata
        category: "payment",
        capabilities: [
            "paypal-checkout",
            "card-payments",
            "paypal-balance",
            "venmo", // US only
            "pay-later",
        ],
        requiredEnvVars: [
            "PAYPAL_CLIENT_ID",
            "PAYPAL_CLIENT_SECRET",
            "PAYPAL_WEBHOOK_ID",
        ],
        optionalEnvVars: [
            "PAYPAL_SANDBOX_MODE",
        ],
        webhookPath: "/api/paypal-webhook",
        docsUrl: "https://developer.paypal.com/docs/checkout/",
        supportedCurrencies: [
            "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "CHF", "SEK", "NOK", "DKK",
            "PLN", "CZK", "HUF", "NZD", "SGD", "HKD", "MXN", "BRL",
        ],
        supportedCountries: [
            "US", "GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH",
            "AU", "NZ", "CA", "JP", "SG", "HK", "BR", "MX",
        ],
        directorApproved: true,
        rapidLaunch: false,
        origin: "core",
    },
];
// ============================================================
// Shipping Provider Templates
// ============================================================
export const shippingProviderTemplates = [
    {
        id: "core.shipping.dhl.standard",
        version: "1.0.0",
        provider: "dhl",
        label: "DHL Express", // i18n-exempt -- TPL-001: template metadata
        description: "DHL Express shipping with real-time rates, label generation, and tracking. Supports international shipping to 220+ countries.", // i18n-exempt -- TPL-001: template metadata
        category: "shipping",
        capabilities: [
            "real-time-rates",
            "label-generation",
            "tracking",
            "international-shipping",
            "express-delivery",
            "customs-documentation",
        ],
        requiredEnvVars: [
            "DHL_API_KEY",
            "DHL_API_SECRET",
            "DHL_ACCOUNT_NUMBER",
        ],
        optionalEnvVars: [
            "DHL_SANDBOX_MODE",
        ],
        docsUrl: "https://developer.dhl.com/",
        supportedCountries: [
            "US", "GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH",
            "AU", "NZ", "CA", "JP", "SG", "HK", "CN", "KR", "IN", "BR",
        ],
        directorApproved: true,
        rapidLaunch: true,
        rapidLaunchOrder: 1,
        origin: "core",
    },
    {
        id: "core.shipping.ups.standard",
        version: "1.0.0",
        provider: "ups",
        label: "UPS", // i18n-exempt -- TPL-001: template metadata
        description: "UPS shipping integration with rate quotes, label printing, and package tracking. Global coverage with multiple service levels.", // i18n-exempt -- TPL-001: template metadata
        category: "shipping",
        capabilities: [
            "real-time-rates",
            "label-generation",
            "tracking",
            "international-shipping",
            "ground-shipping",
            "express-delivery",
            "pickup-scheduling",
        ],
        requiredEnvVars: [
            "UPS_CLIENT_ID",
            "UPS_CLIENT_SECRET",
            "UPS_ACCOUNT_NUMBER",
        ],
        optionalEnvVars: [
            "UPS_SANDBOX_MODE",
        ],
        docsUrl: "https://developer.ups.com/",
        supportedCountries: [
            "US", "GB", "DE", "FR", "IT", "ES", "NL", "BE", "AT", "CH",
            "AU", "NZ", "CA", "MX", "JP", "CN", "KR",
        ],
        directorApproved: true,
        origin: "core",
    },
    {
        id: "core.shipping.premier.standard",
        version: "1.0.0",
        provider: "premier-shipping",
        label: "Premier Shipping", // i18n-exempt -- TPL-001: template metadata
        description: "Premier Shipping for luxury and high-value items. White-glove delivery with signature required and insurance included.", // i18n-exempt -- TPL-001: template metadata
        category: "shipping",
        capabilities: [
            "white-glove-delivery",
            "signature-required",
            "insurance-included",
            "tracking",
            "scheduled-delivery",
        ],
        requiredEnvVars: [
            "PREMIER_API_KEY",
            "PREMIER_MERCHANT_ID",
        ],
        optionalEnvVars: [
            "PREMIER_INSURANCE_LEVEL",
        ],
        docsUrl: "https://docs.premier-shipping.example/",
        supportedCountries: [
            "US", "GB", "DE", "FR", "IT", "CH", "AT",
        ],
        directorApproved: true,
        origin: "core",
    },
    {
        id: "core.shipping.flat-rate.standard",
        version: "1.0.0",
        provider: "flat-rate",
        label: "Flat Rate Shipping", // i18n-exempt -- TPL-001: template metadata
        description: "Simple flat-rate shipping configuration. No external API required - rates are configured in shop settings.", // i18n-exempt -- TPL-001: template metadata
        category: "shipping",
        capabilities: [
            "flat-rate",
            "free-shipping-threshold",
            "zone-based-rates",
        ],
        requiredEnvVars: [],
        requiredConfig: [
            "shipping.flatRate.domestic",
            "shipping.flatRate.international",
            "shipping.freeShippingThreshold",
        ],
        directorApproved: true,
        origin: "core",
    },
];
// ============================================================
// Tax Provider Templates
// ============================================================
export const taxProviderTemplates = [
    {
        id: "core.tax.taxjar.standard",
        version: "1.0.0",
        provider: "taxjar",
        label: "TaxJar", // i18n-exempt -- TPL-001: template metadata
        description: "TaxJar for automated sales tax calculation, reporting, and filing. Covers US, EU VAT, Canada GST/PST, and Australia GST.", // i18n-exempt -- TPL-001: template metadata
        category: "tax",
        capabilities: [
            "real-time-calculation",
            "nexus-management",
            "tax-filing",
            "exemption-certificates",
            "us-sales-tax",
            "eu-vat",
            "canada-gst",
            "australia-gst",
        ],
        requiredEnvVars: [
            "TAXJAR_API_KEY",
        ],
        optionalEnvVars: [
            "TAXJAR_SANDBOX_MODE",
        ],
        docsUrl: "https://developers.taxjar.com/api/reference/",
        supportedCountries: [
            "US", "CA", "AU", "GB", "DE", "FR", "IT", "ES", "NL", "BE",
            "AT", "IE", "PT", "SE", "DK", "FI", "NO", "PL", "CZ",
        ],
        directorApproved: true,
        origin: "core",
    },
    {
        id: "core.tax.manual.standard",
        version: "1.0.0",
        provider: "manual",
        label: "Manual Tax Configuration", // i18n-exempt -- TPL-001: template metadata
        description: "Manual tax rate configuration. Rates are defined in shop settings without external API integration.", // i18n-exempt -- TPL-001: template metadata
        category: "tax",
        capabilities: [
            "fixed-rate",
            "product-category-rates",
            "region-based-rates",
        ],
        requiredEnvVars: [],
        requiredConfig: [
            "tax.defaultRate",
            "tax.regions",
        ],
        directorApproved: true,
        rapidLaunch: true,
        rapidLaunchOrder: 1,
        origin: "core",
    },
];
// ============================================================
// Combined Exports
// ============================================================
export const allProviderTemplates = [
    ...paymentProviderTemplates,
    ...shippingProviderTemplates,
    ...taxProviderTemplates,
];
// Helper functions
export function getProviderTemplate(id) {
    return allProviderTemplates.find((t) => t.id === id);
}
export function getProviderTemplatesByCategory(category) {
    return allProviderTemplates.filter((t) => t.category === category);
}
export function getProviderTemplatesByProvider(provider) {
    return allProviderTemplates.filter((t) => t.provider === provider);
}
export function getDirectorApprovedTemplates(category) {
    return allProviderTemplates.filter((t) => t.directorApproved && (!category || t.category === category));
}
export function getRapidLaunchTemplates(category) {
    const scoped = allProviderTemplates.filter((t) => !category || t.category === category);
    const rapid = scoped.filter((t) => t.rapidLaunch);
    if (rapid.length > 0) {
        return [...rapid].sort((a, b) => (a.rapidLaunchOrder ?? Number.POSITIVE_INFINITY) - (b.rapidLaunchOrder ?? Number.POSITIVE_INFINITY));
    }
    if (scoped.length > 0) {
        // i18n-exempt -- DS-1234 [ttl=2026-12-31] — developer warning only
        console.warn(`[rapid-launch] No provider templates tagged for ${category ?? "any"}; falling back to first available.`);
    }
    return scoped;
}
export function pickRapidLaunchTemplate(category) {
    const templates = getRapidLaunchTemplates(category);
    return templates[0];
}
export function validateProviderTemplate(templateId, category) {
    const template = getProviderTemplate(templateId);
    if (!template) {
        return { valid: false, error: `Template not found: ${templateId}` };
    }
    if (template.category !== category) {
        return {
            valid: false,
            error: `Template ${templateId} is a ${template.category} template, expected ${category}`,
        };
    }
    return { valid: true };
}
