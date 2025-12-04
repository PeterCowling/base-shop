import { z } from "zod";
export { shopSeoFieldsSchema, type ShopSeoFields } from "./shop-seo";
export { shopLocaleSchema, type ShopLocale } from "./shop-locale";
export { shopThemeSchema, type ShopTheme } from "./shop-theme";
export declare const sanityBlogConfigSchema: z.ZodObject<{
    projectId: z.ZodString;
    dataset: z.ZodString;
    token: z.ZodString;
}, "strict", z.ZodTypeAny, {
    dataset: string;
    projectId: string;
    token: string;
}, {
    dataset: string;
    projectId: string;
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
    /** Interval in minutes between service runs */
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
    logo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
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
    /**
     * Shop business model.
     * "sale" indicates a traditional commerce shop while "rental" enables
     * rental-specific features.
     */
    type: z.ZodOptional<z.ZodString>;
    paymentProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    shippingProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    taxProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    billingProvider: z.ZodOptional<z.ZodString>;
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
        dataset: string;
        projectId: string;
        token: string;
    }, {
        dataset: string;
        projectId: string;
        token: string;
    }>>;
    editorialBlog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        promoteSchedule: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        promoteSchedule?: string | undefined;
    }, {
        enabled: boolean;
        promoteSchedule?: string | undefined;
    }>>;
    enableEditorial: z.ZodOptional<z.ZodBoolean>;
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
    termsUrl: z.ZodOptional<z.ZodString>;
    privacyUrl: z.ZodOptional<z.ZodString>;
    returnPolicyUrl: z.ZodOptional<z.ZodString>;
    returnsEnabled: z.ZodOptional<z.ZodBoolean>;
    analyticsEnabled: z.ZodOptional<z.ZodBoolean>;
    coverageIncluded: z.ZodDefault<z.ZodBoolean>;
    showCleaningTransparency: z.ZodOptional<z.ZodBoolean>;
    rentalInventoryAllocation: z.ZodOptional<z.ZodBoolean>;
    luxuryFeatures: z.ZodDefault<z.ZodObject<{
        blog: z.ZodDefault<z.ZodBoolean>;
        contentMerchandising: z.ZodDefault<z.ZodBoolean>;
        raTicketing: z.ZodDefault<z.ZodBoolean>;
        fraudReviewThreshold: z.ZodDefault<z.ZodNumber>;
        requireStrongCustomerAuth: z.ZodDefault<z.ZodBoolean>;
        strictReturnConditions: z.ZodDefault<z.ZodBoolean>;
        trackingDashboard: z.ZodDefault<z.ZodBoolean>;
        premierDelivery: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        blog: boolean;
        premierDelivery: boolean;
        contentMerchandising: boolean;
        raTicketing: boolean;
        fraudReviewThreshold: number;
        requireStrongCustomerAuth: boolean;
        strictReturnConditions: boolean;
        trackingDashboard: boolean;
    }, {
        blog?: boolean | undefined;
        premierDelivery?: boolean | undefined;
        contentMerchandising?: boolean | undefined;
        raTicketing?: boolean | undefined;
        fraudReviewThreshold?: number | undefined;
        requireStrongCustomerAuth?: boolean | undefined;
        strictReturnConditions?: boolean | undefined;
        trackingDashboard?: boolean | undefined;
    }>>;
    lastUpgrade: z.ZodOptional<z.ZodString>;
    componentVersions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    rentalSubscriptions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        price: z.ZodNumber;
        itemsIncluded: z.ZodNumber;
        swapLimit: z.ZodNumber;
        shipmentsPerMonth: z.ZodNumber;
        prorateOnChange: z.ZodDefault<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        id: string;
        price: number;
        itemsIncluded: number;
        swapLimit: number;
        shipmentsPerMonth: number;
        prorateOnChange: boolean;
    }, {
        id: string;
        price: number;
        itemsIncluded: number;
        swapLimit: number;
        shipmentsPerMonth: number;
        prorateOnChange?: boolean | undefined;
    }>, "many">>;
    /**
     * Feature flag to enable rental subscription flows.
     * Sale-only shops should leave this disabled to retain
     * traditional purchasing behavior.
     */
    subscriptionsEnabled: z.ZodDefault<z.ZodBoolean>;
    lateFeePolicy: z.ZodOptional<z.ZodObject<{
        gracePeriodDays: z.ZodNumber;
        feeAmount: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        gracePeriodDays: number;
        feeAmount: number;
    }, {
        gracePeriodDays: number;
        feeAmount: number;
    }>>;
}, "strict", z.ZodTypeAny, {
    id: string;
    themeDefaults: Record<string, string>;
    themeOverrides: Record<string, string>;
    name: string;
    luxuryFeatures: {
        blog: boolean;
        premierDelivery: boolean;
        contentMerchandising: boolean;
        raTicketing: boolean;
        fraudReviewThreshold: number;
        requireStrongCustomerAuth: boolean;
        strictReturnConditions: boolean;
        trackingDashboard: boolean;
    };
    catalogFilters: string[];
    themeId: string;
    themeTokens: Record<string, string>;
    filterMappings: Record<string, string>;
    priceOverrides: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides: Record<string, "en" | "de" | "it">;
    coverageIncluded: boolean;
    componentVersions: Record<string, string>;
    rentalSubscriptions: {
        id: string;
        price: number;
        itemsIncluded: number;
        swapLimit: number;
        shipmentsPerMonth: number;
        prorateOnChange: boolean;
    }[];
    subscriptionsEnabled: boolean;
    type?: string | undefined;
    logo?: Record<string, string> | undefined;
    contactInfo?: string | undefined;
    domain?: {
        name: string;
        status?: string | undefined;
        certificateStatus?: string | undefined;
    } | undefined;
    editorialBlog?: {
        enabled: boolean;
        promoteSchedule?: string | undefined;
    } | undefined;
    paymentProviders?: string[] | undefined;
    shippingProviders?: string[] | undefined;
    taxProviders?: string[] | undefined;
    billingProvider?: string | undefined;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeImage?: string | undefined;
    navigation?: {
        url: string;
        label: string;
    }[] | undefined;
    sanityBlog?: {
        dataset: string;
        projectId: string;
        token: string;
    } | undefined;
    enableEditorial?: boolean | undefined;
    termsUrl?: string | undefined;
    privacyUrl?: string | undefined;
    returnPolicyUrl?: string | undefined;
    returnsEnabled?: boolean | undefined;
    analyticsEnabled?: boolean | undefined;
    showCleaningTransparency?: boolean | undefined;
    rentalInventoryAllocation?: boolean | undefined;
    lastUpgrade?: string | undefined;
    lateFeePolicy?: {
        gracePeriodDays: number;
        feeAmount: number;
    } | undefined;
}, {
    id: string;
    name: string;
    catalogFilters: string[];
    themeId: string;
    filterMappings: Record<string, string>;
    type?: string | undefined;
    logo?: Record<string, string> | undefined;
    contactInfo?: string | undefined;
    themeDefaults?: Record<string, string> | undefined;
    themeOverrides?: Record<string, string> | undefined;
    domain?: {
        name: string;
        status?: string | undefined;
        certificateStatus?: string | undefined;
    } | undefined;
    editorialBlog?: {
        enabled: boolean;
        promoteSchedule?: string | undefined;
    } | undefined;
    luxuryFeatures?: {
        blog?: boolean | undefined;
        premierDelivery?: boolean | undefined;
        contentMerchandising?: boolean | undefined;
        raTicketing?: boolean | undefined;
        fraudReviewThreshold?: number | undefined;
        requireStrongCustomerAuth?: boolean | undefined;
        strictReturnConditions?: boolean | undefined;
        trackingDashboard?: boolean | undefined;
    } | undefined;
    themeTokens?: Record<string, string> | undefined;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>> | undefined;
    localeOverrides?: Record<string, "en" | "de" | "it"> | undefined;
    paymentProviders?: string[] | undefined;
    shippingProviders?: string[] | undefined;
    taxProviders?: string[] | undefined;
    billingProvider?: string | undefined;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeImage?: string | undefined;
    navigation?: {
        url: string;
        label: string;
    }[] | undefined;
    sanityBlog?: {
        dataset: string;
        projectId: string;
        token: string;
    } | undefined;
    enableEditorial?: boolean | undefined;
    termsUrl?: string | undefined;
    privacyUrl?: string | undefined;
    returnPolicyUrl?: string | undefined;
    returnsEnabled?: boolean | undefined;
    analyticsEnabled?: boolean | undefined;
    coverageIncluded?: boolean | undefined;
    showCleaningTransparency?: boolean | undefined;
    rentalInventoryAllocation?: boolean | undefined;
    lastUpgrade?: string | undefined;
    componentVersions?: Record<string, string> | undefined;
    rentalSubscriptions?: {
        id: string;
        price: number;
        itemsIncluded: number;
        swapLimit: number;
        shipmentsPerMonth: number;
        prorateOnChange?: boolean | undefined;
    }[] | undefined;
    subscriptionsEnabled?: boolean | undefined;
    lateFeePolicy?: {
        gracePeriodDays: number;
        feeAmount: number;
    } | undefined;
}>;
export type Shop = z.infer<typeof shopSchema>;
