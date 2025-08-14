import { z } from "zod";
export declare const shopSeoFieldsSchema: z.ZodObject<{
    canonicalBase: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    alt: z.ZodOptional<z.ZodString>;
    openGraph: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        url?: string;
        title?: string;
        image?: string;
        description?: string;
    }, {
        url?: string;
        title?: string;
        image?: string;
        description?: string;
    }>>;
    twitter: z.ZodOptional<z.ZodObject<{
        card: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        title?: string;
        image?: string;
        description?: string;
        card?: string;
    }, {
        title?: string;
        image?: string;
        description?: string;
        card?: string;
    }>>;
    structuredData: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    title?: string;
    image?: string;
    description?: string;
    alt?: string;
    twitter?: {
        title?: string;
        image?: string;
        description?: string;
        card?: string;
    };
    canonicalBase?: string;
    openGraph?: {
        url?: string;
        title?: string;
        image?: string;
        description?: string;
    };
    structuredData?: string;
}, {
    title?: string;
    image?: string;
    description?: string;
    alt?: string;
    twitter?: {
        title?: string;
        image?: string;
        description?: string;
        card?: string;
    };
    canonicalBase?: string;
    openGraph?: {
        url?: string;
        title?: string;
        image?: string;
        description?: string;
    };
    structuredData?: string;
}>;
export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;
export declare const sanityBlogConfigSchema: z.ZodObject<{
    projectId: z.ZodString;
    dataset: z.ZodString;
    token: z.ZodString;
}, "strict", z.ZodTypeAny, {
    dataset?: string;
    projectId?: string;
    token?: string;
}, {
    dataset?: string;
    projectId?: string;
    token?: string;
}>;
export type SanityBlogConfig = z.infer<typeof sanityBlogConfigSchema>;
export declare const shopDomainSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    certificateStatus: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    name?: string;
    status?: string;
    certificateStatus?: string;
}, {
    name?: string;
    status?: string;
    certificateStatus?: string;
}>;
export type ShopDomain = z.infer<typeof shopDomainSchema>;
export declare const shopSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    logo: z.ZodOptional<z.ZodString>;
    contactInfo: z.ZodOptional<z.ZodString>;
    catalogFilters: z.ZodArray<z.ZodString, "many">;
    themeId: z.ZodString;
    /** Mapping of design tokens to original theme values */
    themeDefaults: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    /** Mapping of token overrides to theme values */
    themeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    /** Mapping of design tokens to theme values (defaults merged with overrides) */
    themeTokens: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Optional price overrides per locale (minor units) */
    priceOverrides: z.ZodDefault<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodNumber>>;
    /** Optional redirect overrides for locale detection */
    localeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodEnum<["en", "de", "it"]>>>;
    type: z.ZodOptional<z.ZodString>;
    paymentProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    shippingProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    taxProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    homeTitle: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    homeDescription: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    homeImage: z.ZodOptional<z.ZodString>;
    navigation: z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        url: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        url?: string;
        label?: string;
    }, {
        url?: string;
        label?: string;
    }>, "many">>;
    sanityBlog: z.ZodOptional<z.ZodObject<{
        projectId: z.ZodString;
        dataset: z.ZodString;
        token: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        dataset?: string;
        projectId?: string;
        token?: string;
    }, {
        dataset?: string;
        projectId?: string;
        token?: string;
    }>>;
    editorialBlog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        promoteSchedule: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        enabled?: boolean;
        promoteSchedule?: string;
    }, {
        enabled?: boolean;
        promoteSchedule?: string;
    }>>;
    enableEditorial: z.ZodOptional<z.ZodBoolean>;
    domain: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        certificateStatus: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        name?: string;
        status?: string;
        certificateStatus?: string;
    }, {
        name?: string;
        status?: string;
        certificateStatus?: string;
    }>>;
    returnPolicyUrl: z.ZodOptional<z.ZodString>;
    returnsEnabled: z.ZodOptional<z.ZodBoolean>;
    analyticsEnabled: z.ZodOptional<z.ZodBoolean>;
    luxuryFeatures: z.ZodDefault<z.ZodObject<{
        contentMerchandising: z.ZodDefault<z.ZodBoolean>;
        raTicketing: z.ZodDefault<z.ZodBoolean>;
        fraudReview: z.ZodDefault<z.ZodBoolean>;
        strictReturnConditions: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        contentMerchandising?: boolean;
        raTicketing?: boolean;
        fraudReview?: boolean;
        strictReturnConditions?: boolean;
    }, {
        contentMerchandising?: boolean;
        raTicketing?: boolean;
        fraudReview?: boolean;
        strictReturnConditions?: boolean;
    }>>;
    lateFeePolicy: z.ZodDefault<z.ZodObject<{
        gracePeriodDays: z.ZodDefault<z.ZodNumber>;
        feeAmount: z.ZodDefault<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        gracePeriodDays?: number;
        feeAmount?: number;
    }, {
        gracePeriodDays?: number;
        feeAmount?: number;
    }>>;
    lastUpgrade: z.ZodOptional<z.ZodString>;
    componentVersions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name?: string;
    type?: string;
    id?: string;
    logo?: string;
    contactInfo?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeDefaults?: Record<string, string>;
    themeOverrides?: Record<string, string>;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides?: Record<string, "en" | "de" | "it">;
    paymentProviders?: string[];
    shippingProviders?: string[];
    taxProviders?: string[];
    homeTitle?: Partial<Record<"en" | "de" | "it", string>>;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>>;
    homeImage?: string;
    navigation?: {
        url?: string;
        label?: string;
    }[];
    sanityBlog?: {
        dataset?: string;
        projectId?: string;
        token?: string;
    };
    editorialBlog?: {
        enabled?: boolean;
        promoteSchedule?: string;
    };
    enableEditorial?: boolean;
    domain?: {
        name?: string;
        status?: string;
        certificateStatus?: string;
    };
    returnPolicyUrl?: string;
    returnsEnabled?: boolean;
    analyticsEnabled?: boolean;
    luxuryFeatures?: {
        contentMerchandising?: boolean;
        raTicketing?: boolean;
        fraudReview?: boolean;
        strictReturnConditions?: boolean;
    };
    lateFeePolicy?: {
        gracePeriodDays?: number;
        feeAmount?: number;
    };
    lastUpgrade?: string;
    componentVersions?: Record<string, string>;
}, {
    name?: string;
    type?: string;
    id?: string;
    logo?: string;
    contactInfo?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeDefaults?: Record<string, string>;
    themeOverrides?: Record<string, string>;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides?: Record<string, "en" | "de" | "it">;
    paymentProviders?: string[];
    shippingProviders?: string[];
    taxProviders?: string[];
    homeTitle?: Partial<Record<"en" | "de" | "it", string>>;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>>;
    homeImage?: string;
    navigation?: {
        url?: string;
        label?: string;
    }[];
    sanityBlog?: {
        dataset?: string;
        projectId?: string;
        token?: string;
    };
    editorialBlog?: {
        enabled?: boolean;
        promoteSchedule?: string;
    };
    enableEditorial?: boolean;
    domain?: {
        name?: string;
        status?: string;
        certificateStatus?: string;
    };
    returnPolicyUrl?: string;
    returnsEnabled?: boolean;
    analyticsEnabled?: boolean;
    luxuryFeatures?: {
        contentMerchandising?: boolean;
        raTicketing?: boolean;
        fraudReview?: boolean;
        strictReturnConditions?: boolean;
    };
    lateFeePolicy?: {
        gracePeriodDays?: number;
        feeAmount?: number;
    };
    lastUpgrade?: string;
    componentVersions?: Record<string, string>;
}>;
export type Shop = z.infer<typeof shopSchema>;
