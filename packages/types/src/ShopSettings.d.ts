import { z } from "zod";
export declare const aiCatalogFieldSchema: z.ZodEnum<["id", "title", "description", "price", "media"]>;
export declare const aiCatalogConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "media"]>, "many">;
    pageSize: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    enabled: boolean;
    fields: ("id" | "title" | "description" | "price" | "media")[];
    pageSize: number;
}, {
    enabled: boolean;
    fields: ("id" | "title" | "description" | "price" | "media")[];
    pageSize: number;
}>;
export declare const seoSettingsSchema: z.ZodObject<{
    aiCatalog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "media"]>, "many">;
        pageSize: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "media")[];
        pageSize: number;
    }, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "media")[];
        pageSize: number;
    }>>;
}, "strip", z.ZodObject<{
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
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    }, {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    }>>;
    twitter: z.ZodOptional<z.ZodObject<{
        card: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    }>>;
    structuredData: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    canonicalBase?: string | undefined;
    alt?: string | undefined;
    openGraph?: {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    canonicalBase?: string | undefined;
    alt?: string | undefined;
    openGraph?: {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}>, z.objectOutputType<{
    aiCatalog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "media"]>, "many">;
        pageSize: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "media")[];
        pageSize: number;
    }, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "media")[];
        pageSize: number;
    }>>;
}, z.ZodObject<{
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
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    }, {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    }>>;
    twitter: z.ZodOptional<z.ZodObject<{
        card: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    }>>;
    structuredData: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    canonicalBase?: string | undefined;
    alt?: string | undefined;
    openGraph?: {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    canonicalBase?: string | undefined;
    alt?: string | undefined;
    openGraph?: {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}>, "strip">, z.objectInputType<{
    aiCatalog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "media"]>, "many">;
        pageSize: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "media")[];
        pageSize: number;
    }, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "media")[];
        pageSize: number;
    }>>;
}, z.ZodObject<{
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
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    }, {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    }>>;
    twitter: z.ZodOptional<z.ZodObject<{
        card: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    }>>;
    structuredData: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    canonicalBase?: string | undefined;
    alt?: string | undefined;
    openGraph?: {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    image?: string | undefined;
    canonicalBase?: string | undefined;
    alt?: string | undefined;
    openGraph?: {
        url?: string | undefined;
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
    } | undefined;
    twitter?: {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        card?: string | undefined;
    } | undefined;
    structuredData?: string | undefined;
}>, "strip">>;
export declare const stockAlertConfigSchema: z.ZodObject<{
    recipients: z.ZodArray<z.ZodString, "many">;
    webhook: z.ZodOptional<z.ZodString>;
    threshold: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    recipients: string[];
    webhook?: string | undefined;
    threshold?: number | undefined;
}, {
    recipients: string[];
    webhook?: string | undefined;
    threshold?: number | undefined;
}>;
export declare const shopSettingsSchema: z.ZodObject<{
    languages: z.ZodReadonly<z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">>;
    seo: z.ZodObject<{
        aiCatalog: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "media"]>, "many">;
            pageSize: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        }, {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        }>>;
    }, "strip", z.ZodObject<{
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
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        }, {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        }>>;
        twitter: z.ZodOptional<z.ZodObject<{
            card: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            image: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        }, {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        }>>;
        structuredData: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        canonicalBase?: string | undefined;
        alt?: string | undefined;
        openGraph?: {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        } | undefined;
        twitter?: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        } | undefined;
        structuredData?: string | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        canonicalBase?: string | undefined;
        alt?: string | undefined;
        openGraph?: {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        } | undefined;
        twitter?: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        } | undefined;
        structuredData?: string | undefined;
    }>, z.objectOutputType<{
        aiCatalog: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "media"]>, "many">;
            pageSize: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        }, {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        }>>;
    }, z.ZodObject<{
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
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        }, {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        }>>;
        twitter: z.ZodOptional<z.ZodObject<{
            card: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            image: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        }, {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        }>>;
        structuredData: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        canonicalBase?: string | undefined;
        alt?: string | undefined;
        openGraph?: {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        } | undefined;
        twitter?: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        } | undefined;
        structuredData?: string | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        canonicalBase?: string | undefined;
        alt?: string | undefined;
        openGraph?: {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        } | undefined;
        twitter?: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        } | undefined;
        structuredData?: string | undefined;
    }>, "strip">, z.objectInputType<{
        aiCatalog: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "media"]>, "many">;
            pageSize: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        }, {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        }>>;
    }, z.ZodObject<{
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
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        }, {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        }>>;
        twitter: z.ZodOptional<z.ZodObject<{
            card: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            image: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        }, {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        }>>;
        structuredData: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        canonicalBase?: string | undefined;
        alt?: string | undefined;
        openGraph?: {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        } | undefined;
        twitter?: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        } | undefined;
        structuredData?: string | undefined;
    }, {
        title?: string | undefined;
        description?: string | undefined;
        image?: string | undefined;
        canonicalBase?: string | undefined;
        alt?: string | undefined;
        openGraph?: {
            url?: string | undefined;
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
        } | undefined;
        twitter?: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            card?: string | undefined;
        } | undefined;
        structuredData?: string | undefined;
    }>, "strip">>;
    analytics: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        provider: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    }, {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    }>>;
    leadCapture: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        provider: z.ZodOptional<z.ZodString>;
        endpoint: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        provider?: string | undefined;
        endpoint?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        provider?: string | undefined;
        endpoint?: string | undefined;
    }>>;
    freezeTranslations: z.ZodOptional<z.ZodBoolean>;
    /** ISO currency code used as the shop's base currency */
    currency: z.ZodOptional<z.ZodString>;
    /** Region identifier for tax calculations */
    taxRegion: z.ZodOptional<z.ZodString>;
    depositService: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        /** Interval in minutes between deposit release checks */
        intervalMinutes: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        intervalMinutes: number;
    }, {
        enabled: boolean;
        intervalMinutes: number;
    }>>;
    reverseLogisticsService: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        intervalMinutes: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        intervalMinutes: number;
    }, {
        enabled: boolean;
        intervalMinutes: number;
    }>>;
    lateFeeService: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        intervalMinutes: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled: boolean;
        intervalMinutes: number;
    }, {
        enabled: boolean;
        intervalMinutes: number;
    }>>;
    returnService: z.ZodOptional<z.ZodObject<{
        upsEnabled: z.ZodBoolean;
        bagEnabled: z.ZodOptional<z.ZodBoolean>;
        homePickupEnabled: z.ZodOptional<z.ZodBoolean>;
    }, "strict", z.ZodTypeAny, {
        upsEnabled: boolean;
        bagEnabled?: boolean | undefined;
        homePickupEnabled?: boolean | undefined;
    }, {
        upsEnabled: boolean;
        bagEnabled?: boolean | undefined;
        homePickupEnabled?: boolean | undefined;
    }>>;
    premierDelivery: z.ZodOptional<z.ZodObject<{
        regions: z.ZodArray<z.ZodString, "many">;
        windows: z.ZodArray<z.ZodString, "many">;
        carriers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        surcharge: z.ZodOptional<z.ZodNumber>;
        serviceLabel: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        regions: string[];
        windows: string[];
        carriers: string[];
        surcharge?: number | undefined;
        serviceLabel?: string | undefined;
    }, {
        regions: string[];
        windows: string[];
        carriers?: string[] | undefined;
        surcharge?: number | undefined;
        serviceLabel?: string | undefined;
    }>>;
    stockAlert: z.ZodOptional<z.ZodObject<{
        recipients: z.ZodArray<z.ZodString, "many">;
        webhook: z.ZodOptional<z.ZodString>;
        threshold: z.ZodOptional<z.ZodNumber>;
    }, "strict", z.ZodTypeAny, {
        recipients: string[];
        webhook?: string | undefined;
        threshold?: number | undefined;
    }, {
        recipients: string[];
        webhook?: string | undefined;
        threshold?: number | undefined;
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
    /** Feature flag to enable or disable all tracking */
    trackingEnabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    /** Tracking providers enabled for shipment/return tracking */
    trackingProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
}, "strict", z.ZodTypeAny, {
    languages: readonly ("en" | "de" | "it")[];
    seo: {
        aiCatalog?: {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        } | undefined;
    } & {
        [k: string]: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            canonicalBase?: string | undefined;
            alt?: string | undefined;
            openGraph?: {
                url?: string | undefined;
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
            } | undefined;
            twitter?: {
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
                card?: string | undefined;
            } | undefined;
            structuredData?: string | undefined;
        };
    };
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
    updatedAt: string;
    updatedBy: string;
    analytics?: {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    } | undefined;
    leadCapture?: {
        enabled?: boolean | undefined;
        provider?: string | undefined;
        endpoint?: string | undefined;
    } | undefined;
    freezeTranslations?: boolean | undefined;
    currency?: string | undefined;
    taxRegion?: string | undefined;
    depositService?: {
        enabled: boolean;
        intervalMinutes: number;
    } | undefined;
    reverseLogisticsService?: {
        enabled: boolean;
        intervalMinutes: number;
    } | undefined;
    lateFeeService?: {
        enabled: boolean;
        intervalMinutes: number;
    } | undefined;
    returnService?: {
        upsEnabled: boolean;
        bagEnabled?: boolean | undefined;
        homePickupEnabled?: boolean | undefined;
    } | undefined;
    premierDelivery?: {
        regions: string[];
        windows: string[];
        carriers: string[];
        surcharge?: number | undefined;
        serviceLabel?: string | undefined;
    } | undefined;
    stockAlert?: {
        recipients: string[];
        webhook?: string | undefined;
        threshold?: number | undefined;
    } | undefined;
    editorialBlog?: {
        enabled: boolean;
        promoteSchedule?: string | undefined;
    } | undefined;
    trackingEnabled?: boolean | undefined;
    trackingProviders?: string[] | undefined;
}, {
    languages: readonly ("en" | "de" | "it")[];
    seo: {
        aiCatalog?: {
            enabled: boolean;
            fields: ("id" | "title" | "description" | "price" | "media")[];
            pageSize: number;
        } | undefined;
    } & {
        [k: string]: {
            title?: string | undefined;
            description?: string | undefined;
            image?: string | undefined;
            canonicalBase?: string | undefined;
            alt?: string | undefined;
            openGraph?: {
                url?: string | undefined;
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
            } | undefined;
            twitter?: {
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
                card?: string | undefined;
            } | undefined;
            structuredData?: string | undefined;
        };
    };
    updatedAt: string;
    updatedBy: string;
    analytics?: {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    } | undefined;
    leadCapture?: {
        enabled?: boolean | undefined;
        provider?: string | undefined;
        endpoint?: string | undefined;
    } | undefined;
    freezeTranslations?: boolean | undefined;
    currency?: string | undefined;
    taxRegion?: string | undefined;
    depositService?: {
        enabled: boolean;
        intervalMinutes: number;
    } | undefined;
    reverseLogisticsService?: {
        enabled: boolean;
        intervalMinutes: number;
    } | undefined;
    lateFeeService?: {
        enabled: boolean;
        intervalMinutes: number;
    } | undefined;
    returnService?: {
        upsEnabled: boolean;
        bagEnabled?: boolean | undefined;
        homePickupEnabled?: boolean | undefined;
    } | undefined;
    premierDelivery?: {
        regions: string[];
        windows: string[];
        carriers?: string[] | undefined;
        surcharge?: number | undefined;
        serviceLabel?: string | undefined;
    } | undefined;
    stockAlert?: {
        recipients: string[];
        webhook?: string | undefined;
        threshold?: number | undefined;
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
    trackingEnabled?: boolean | undefined;
    trackingProviders?: string[] | undefined;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
export type AiCatalogConfig = z.infer<typeof aiCatalogConfigSchema>;
export type AiCatalogField = z.infer<typeof aiCatalogFieldSchema>;
export type StockAlertConfig = z.infer<typeof stockAlertConfigSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map