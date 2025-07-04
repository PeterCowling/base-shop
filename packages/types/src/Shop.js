import { z } from "zod";
import { localeSchema } from "./Product";
export const shopSeoFieldsSchema = z.object({
    canonicalBase: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    openGraph: z
        .object({
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().optional(),
        image: z.string().optional(),
    })
        .optional(),
    twitter: z
        .object({
        card: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(),
    })
        .optional(),
    structuredData: z.string().optional(),
});
export const shopSchema = z.object({
    id: z.string(),
    name: z.string(),
    logo: z.string().optional(),
    contactInfo: z.string().optional(),
    catalogFilters: z.array(z.string()),
    themeId: z.string(),
    /** Mapping of design tokens to theme values */
    themeTokens: z.record(z.string()),
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: z.record(z.string()),
    /** Optional price overrides per locale (minor units) */
    priceOverrides: z.record(localeSchema, z.number()).default({}),
    /** Optional redirect overrides for locale detection */
    localeOverrides: z.record(z.string(), localeSchema).default({}),
    type: z.string().optional(),
    paymentProviders: z.array(z.string()).optional(),
    shippingProviders: z.array(z.string()).optional(),
    homeTitle: z.record(localeSchema, z.string()).optional(),
    homeDescription: z.record(localeSchema, z.string()).optional(),
    homeImage: z.string().optional(),
    navigation: z
        .array(z.object({ label: z.string(), url: z.string() }))
        .optional(),
});
