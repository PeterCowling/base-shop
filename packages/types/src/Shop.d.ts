import { z } from "zod";
import { type Locale, type Translated } from "./Product";
export declare const shopSeoFieldsSchema: z.ZodObject<{
    canonicalBase: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    openGraph: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        url?: string | undefined;
    }, {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        url?: string | undefined;
    }>>;
    twitter: z.ZodOptional<z.ZodObject<{
        card: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        card?: string | undefined;
    }, {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        card?: string | undefined;
    }>>;
    structuredData: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    image?: string | undefined;
    description?: string | undefined;
    canonicalBase?: string | undefined;
    openGraph?: {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        url?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}, {
    title?: string | undefined;
    image?: string | undefined;
    description?: string | undefined;
    canonicalBase?: string | undefined;
    openGraph?: {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        url?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}>;
export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;
export interface Shop {
    id: string;
    name: string;
    logo?: string;
    contactInfo?: string;
    catalogFilters: string[];
    themeId: string;
    /** Mapping of design tokens to theme values */
    themeTokens: Record<string, string>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: Record<string, string>;
    /** Optional price overrides per locale (minor units) */
    priceOverrides: Partial<Record<Locale, number>>;
    /** Optional redirect overrides for locale detection */
    localeOverrides: Record<string, Locale>;
    /** Sale or rental shop type */
    type?: string;
    /** Enabled payment provider identifiers */
    paymentProviders?: string[];
    /** Enabled shipping provider identifiers */
    shippingProviders?: string[];
    homeTitle?: Translated;
    homeDescription?: Translated;
    homeImage?: string;
    navigation?: {
        label: string;
        url: string;
    }[];
    /** Analytics provider configuration */
    analytics?: {
        provider: string;
        id?: string | undefined;
    } | undefined;
}
export declare const shopSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    logo: z.ZodOptional<z.ZodString>;
    contactInfo: z.ZodOptional<z.ZodString>;
    catalogFilters: z.ZodArray<z.ZodString, "many">;
    themeId: z.ZodString;
    /** Mapping of design tokens to theme values */
    themeTokens: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Optional price overrides per locale (minor units) */
    priceOverrides: z.ZodDefault<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodNumber>>;
    /** Optional redirect overrides for locale detection */
    localeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodEnum<["en", "de", "it"]>>>;
    type: z.ZodOptional<z.ZodString>;
    paymentProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    shippingProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    homeTitle: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    homeDescription: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    homeImage: z.ZodOptional<z.ZodString>;
    navigation: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        label: string;
    }, {
        url: string;
        label: string;
    }>, "many">>;
    analytics: z.ZodOptional<z.ZodObject<{
        provider: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        id?: string | undefined;
    }, {
        provider: string;
        id?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    catalogFilters: string[];
    themeId: string;
    themeTokens: Record<string, string>;
    filterMappings: Record<string, string>;
    priceOverrides: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides: Record<string, "en" | "de" | "it">;
    type?: string | undefined;
    logo?: string | undefined;
    contactInfo?: string | undefined;
    paymentProviders?: string[] | undefined;
    shippingProviders?: string[] | undefined;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeImage?: string | undefined;
    navigation?: {
        url: string;
        label: string;
    }[] | undefined;
    analytics?: {
        provider: string;
        id?: string | undefined;
    } | undefined;
}, {
    id: string;
    name: string;
    catalogFilters: string[];
    themeId: string;
    themeTokens: Record<string, string>;
    filterMappings: Record<string, string>;
    type?: string | undefined;
    logo?: string | undefined;
    contactInfo?: string | undefined;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>> | undefined;
    localeOverrides?: Record<string, "en" | "de" | "it"> | undefined;
    paymentProviders?: string[] | undefined;
    shippingProviders?: string[] | undefined;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeImage?: string | undefined;
    navigation?: {
        url: string;
        label: string;
    }[] | undefined;
}>;
//# sourceMappingURL=Shop.d.ts.map