/**
 * Provider Templates (LAUNCH-28 + LAUNCH-14)
 *
 * Templates for payment and shipping providers used in shop configuration.
 * These describe provider capabilities, required configuration, and
 * integration requirements for the launch pipeline.
 */
import { z } from "zod";
export declare const providerTemplateSchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodString;
    provider: z.ZodString;
    label: z.ZodString;
    description: z.ZodString;
    category: z.ZodEnum<["payment", "shipping", "tax"]>;
    /** Capabilities this template enables */
    capabilities: z.ZodArray<z.ZodString, "many">;
    /** Required environment variables */
    requiredEnvVars: z.ZodArray<z.ZodString, "many">;
    /** Optional environment variables */
    optionalEnvVars: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Required configuration fields in shop config */
    requiredConfig: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Webhook endpoint path (relative to app root) */
    webhookPath: z.ZodOptional<z.ZodString>;
    /** Documentation URL */
    docsUrl: z.ZodOptional<z.ZodString>;
    /** Supported currencies (ISO 4217) */
    supportedCurrencies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Supported countries (ISO 3166-1 alpha-2) */
    supportedCountries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    /** Director-approved for Basic tier */
    directorApproved: z.ZodDefault<z.ZodBoolean>;
    /** Show in rapid-launch wizard */
    rapidLaunch: z.ZodOptional<z.ZodBoolean>;
    /** Sort order within rapid-launch wizard */
    rapidLaunchOrder: z.ZodOptional<z.ZodNumber>;
    /** Template origin */
    origin: z.ZodDefault<z.ZodEnum<["core", "custom"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    version: string;
    provider: string;
    label: string;
    description: string;
    category: "shipping" | "payment" | "tax";
    capabilities: string[];
    requiredEnvVars: string[];
    directorApproved: boolean;
    origin: "core" | "custom";
    optionalEnvVars?: string[] | undefined;
    requiredConfig?: string[] | undefined;
    webhookPath?: string | undefined;
    docsUrl?: string | undefined;
    supportedCurrencies?: string[] | undefined;
    supportedCountries?: string[] | undefined;
    rapidLaunch?: boolean | undefined;
    rapidLaunchOrder?: number | undefined;
}, {
    id: string;
    version: string;
    provider: string;
    label: string;
    description: string;
    category: "shipping" | "payment" | "tax";
    capabilities: string[];
    requiredEnvVars: string[];
    optionalEnvVars?: string[] | undefined;
    requiredConfig?: string[] | undefined;
    webhookPath?: string | undefined;
    docsUrl?: string | undefined;
    supportedCurrencies?: string[] | undefined;
    supportedCountries?: string[] | undefined;
    directorApproved?: boolean | undefined;
    rapidLaunch?: boolean | undefined;
    rapidLaunchOrder?: number | undefined;
    origin?: "core" | "custom" | undefined;
}>;
export type ProviderTemplate = z.infer<typeof providerTemplateSchema>;
export declare const paymentProviderTemplates: ProviderTemplate[];
export declare const shippingProviderTemplates: ProviderTemplate[];
export declare const taxProviderTemplates: ProviderTemplate[];
export declare const allProviderTemplates: ProviderTemplate[];
export declare function getProviderTemplate(id: string): ProviderTemplate | undefined;
export declare function getProviderTemplatesByCategory(category: "payment" | "shipping" | "tax"): ProviderTemplate[];
export declare function getProviderTemplatesByProvider(provider: string): ProviderTemplate[];
export declare function getDirectorApprovedTemplates(category?: "payment" | "shipping" | "tax"): ProviderTemplate[];
export declare function getRapidLaunchTemplates(category?: "payment" | "shipping" | "tax"): ProviderTemplate[];
export declare function pickRapidLaunchTemplate(category: "payment" | "shipping" | "tax"): ProviderTemplate | undefined;
export declare function validateProviderTemplate(templateId: string, category: "payment" | "shipping" | "tax"): {
    valid: true;
} | {
    valid: false;
    error: string;
};
//# sourceMappingURL=providerTemplates.d.ts.map