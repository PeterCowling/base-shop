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
        title?: string | undefined;
        image?: string | undefined;
        url?: string | undefined;
        description?: string | undefined;
    }, {
        title?: string | undefined;
        image?: string | undefined;
        url?: string | undefined;
        description?: string | undefined;
    }>>;
    twitter: z.ZodOptional<z.ZodObject<{
        card: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
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
}, "strict", z.ZodTypeAny, {
    title?: string | undefined;
    image?: string | undefined;
    description?: string | undefined;
    canonicalBase?: string | undefined;
    alt?: string | undefined;
    openGraph?: {
        title?: string | undefined;
        image?: string | undefined;
        url?: string | undefined;
        description?: string | undefined;
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
    alt?: string | undefined;
    openGraph?: {
        title?: string | undefined;
        image?: string | undefined;
        url?: string | undefined;
        description?: string | undefined;
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
export declare const sanityBlogConfigSchema: z.ZodObject<{
    projectId: z.ZodString;
    dataset: z.ZodString;
    token: z.ZodString;
}, "strict", z.ZodTypeAny, {
    projectId: string;
    dataset: string;
    token: string;
}, {
    projectId: string;
    dataset: string;
    token: string;
}>;
export type SanityBlogConfig = z.infer<typeof sanityBlogConfigSchema>;
export declare const shopDomainSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodOptional<z.ZodString>;
    certificateStatus: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    name: string;
    status?: string | undefined;
    certificateStatus?: string | undefined;
}, {
    name: string;
    status?: string | undefined;
    certificateStatus?: string | undefined;
}>;
export type ShopDomain = z.infer<typeof shopDomainSchema>;

export declare const lateFeeServiceSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    intervalMinutes: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    enabled: boolean;
    intervalMinutes: number;
}, {
    enabled: boolean;
    intervalMinutes: number;
}>;
export type LateFeeService = z.infer<typeof lateFeeServiceSchema>;
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
        url: string;
        label: string;
    }, {
        url: string;
        label: string;
    }>, "many">>;
    sanityBlog: z.ZodOptional<z.ZodObject<{
        projectId: z.ZodString;
        dataset: z.ZodString;
        token: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        projectId: string;
        dataset: string;
        token: string;
    }, {
        projectId: string;
        dataset: string;
        token: string;
    }>>;
    domain: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodOptional<z.ZodString>;
        certificateStatus: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        name: string;
        status?: string | undefined;
        certificateStatus?: string | undefined;
    }, {
        name: string;
        status?: string | undefined;
        certificateStatus?: string | undefined;
    }>>;
    returnPolicyUrl: z.ZodOptional<z.ZodString>;
    returnsEnabled: z.ZodOptional<z.ZodBoolean>;
    analyticsEnabled: z.ZodOptional<z.ZodBoolean>;
    coverageIncluded: z.ZodDefault<z.ZodBoolean>;
    rentalInventoryAllocation: z.ZodOptional<z.ZodBoolean>;
    lastUpgrade: z.ZodOptional<z.ZodString>;
    componentVersions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    catalogFilters: string[];
    themeId: string;
    themeDefaults: Record<string, string>;
    themeOverrides: Record<string, string>;
    themeTokens: Record<string, string>;
    filterMappings: Record<string, string>;
    priceOverrides: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides: Record<string, "en" | "de" | "it">;
    type?: string | undefined;
    logo?: string | undefined;
    contactInfo?: string | undefined;
    paymentProviders?: string[] | undefined;
    shippingProviders?: string[] | undefined;
    taxProviders?: string[] | undefined;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeImage?: string | undefined;
    navigation?: {
        url: string;
        label: string;
    }[] | undefined;
    sanityBlog?: {
        projectId: string;
        dataset: string;
        token: string;
    } | undefined;
    enableEditorial?: boolean | undefined;
    domain?: {
        name: string;
        status?: string | undefined;
        certificateStatus?: string | undefined;
    } | undefined;
    returnPolicyUrl?: string | undefined;
    returnsEnabled?: boolean | undefined;
    analyticsEnabled?: boolean | undefined;
    coverageIncluded: boolean;
    rentalInventoryAllocation?: boolean | undefined;
    lastUpgrade?: string | undefined;
    componentVersions: Record<string, string>;
}, {
    id: string;
    name: string;
    catalogFilters: string[];
    themeId: string;
    filterMappings: Record<string, string>;
    type?: string | undefined;
    logo?: string | undefined;
    contactInfo?: string | undefined;
    themeDefaults?: Record<string, string> | undefined;
    themeOverrides?: Record<string, string> | undefined;
    themeTokens?: Record<string, string> | undefined;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>> | undefined;
    localeOverrides?: Record<string, "en" | "de" | "it"> | undefined;
    paymentProviders?: string[] | undefined;
    shippingProviders?: string[] | undefined;
    taxProviders?: string[] | undefined;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeImage?: string | undefined;
    navigation?: {
        url: string;
        label: string;
    }[] | undefined;
    sanityBlog?: {
        projectId: string;
        dataset: string;
        token: string;
    } | undefined;
    enableEditorial?: boolean | undefined;
    domain?: {
        name: string;
        status?: string | undefined;
        certificateStatus?: string | undefined;
    } | undefined;
    returnPolicyUrl?: string | undefined;
    returnsEnabled?: boolean | undefined;
    analyticsEnabled?: boolean | undefined;
    coverageIncluded?: boolean | undefined;
    rentalInventoryAllocation?: boolean | undefined;
    lastUpgrade?: string | undefined;
    componentVersions?: Record<string, string> | undefined;
}>; 
export type Shop = z.infer<typeof shopSchema>;
//# sourceMappingURL=Shop.d.ts.map