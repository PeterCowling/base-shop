import { z } from "zod";
export declare const shopSettingsSchema: z.ZodObject<{
    languages: z.ZodReadonly<z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">>;
    seo: z.ZodObject<{
        aiCatalog: z.ZodOptional<z.ZodObject<{
            fields: z.ZodArray<z.ZodString, "many">;
            pageSize: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            fields?: string[];
            pageSize?: number;
        }, {
            fields?: string[];
            pageSize?: number;
        }>>;
    }, "strip", z.ZodObject<{
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
        }, "strip", z.ZodTypeAny, {
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
    }, "strip", z.ZodTypeAny, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            url?: string;
            title?: string;
            image?: string;
            description?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            url?: string;
            title?: string;
            image?: string;
            description?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }>, z.objectOutputType<{
        aiCatalog: z.ZodOptional<z.ZodObject<{
            fields: z.ZodArray<z.ZodString, "many">;
            pageSize: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            fields?: string[];
            pageSize?: number;
        }, {
            fields?: string[];
            pageSize?: number;
        }>>;
    }, z.ZodObject<{
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
        }, "strip", z.ZodTypeAny, {
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
    }, "strip", z.ZodTypeAny, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            url?: string;
            title?: string;
            image?: string;
            description?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            url?: string;
            title?: string;
            image?: string;
            description?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }>, "strip">, z.objectInputType<{
        aiCatalog: z.ZodOptional<z.ZodObject<{
            fields: z.ZodArray<z.ZodString, "many">;
            pageSize: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            fields?: string[];
            pageSize?: number;
        }, {
            fields?: string[];
            pageSize?: number;
        }>>;
    }, z.ZodObject<{
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
        }, "strip", z.ZodTypeAny, {
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
    }, "strip", z.ZodTypeAny, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            url?: string;
            title?: string;
            image?: string;
            description?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            url?: string;
            title?: string;
            image?: string;
            description?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }>, "strip">>;
    analytics: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        provider: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        enabled?: boolean;
        provider?: string;
    }, {
        id?: string;
        enabled?: boolean;
        provider?: string;
    }>>;
    freezeTranslations: z.ZodOptional<z.ZodBoolean>;
    /** ISO currency code used as the shop's base currency */
    currency: z.ZodOptional<z.ZodString>;
    /** Region identifier for tax calculations */
    taxRegion: z.ZodOptional<z.ZodString>;
    depositService: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        interval: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        interval?: number;
        enabled?: boolean;
    }, {
        interval?: number;
        enabled?: boolean;
    }>>;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currency?: string;
    languages?: readonly ("en" | "de" | "it")[];
    seo?: {
        aiCatalog?: {
            fields?: string[];
            pageSize?: number;
        };
    } & {
        [k: string]: {
            title?: string;
            image?: string;
            description?: string;
            canonicalBase?: string;
            openGraph?: {
                url?: string;
                title?: string;
                image?: string;
                description?: string;
            };
            twitter?: {
                title?: string;
                image?: string;
                description?: string;
                card?: string;
            };
            structuredData?: string;
        };
    };
    analytics?: {
        id?: string;
        enabled?: boolean;
        provider?: string;
    };
    freezeTranslations?: boolean;
    taxRegion?: string;
    depositService?: {
        interval?: number;
        enabled?: boolean;
    };
    updatedAt?: string;
    updatedBy?: string;
}, {
    currency?: string;
    languages?: readonly ("en" | "de" | "it")[];
    seo?: {
        aiCatalog?: {
            fields?: string[];
            pageSize?: number;
        };
    } & {
        [k: string]: {
            title?: string;
            image?: string;
            description?: string;
            canonicalBase?: string;
            openGraph?: {
                url?: string;
                title?: string;
                image?: string;
                description?: string;
            };
            twitter?: {
                title?: string;
                image?: string;
                description?: string;
                card?: string;
            };
            structuredData?: string;
        };
    };
    analytics?: {
        id?: string;
        enabled?: boolean;
        provider?: string;
    };
    freezeTranslations?: boolean;
    taxRegion?: string;
    depositService?: {
        interval?: number;
        enabled?: boolean;
    };
    updatedAt?: string;
    updatedBy?: string;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
