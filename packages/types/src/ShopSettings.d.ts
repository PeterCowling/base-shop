import { z } from "zod";
export declare const aiCatalogFieldSchema: z.ZodEnum<["id", "title", "description", "price", "images"]>;
export declare const aiCatalogConfigSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
    fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
    pageSize: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    enabled?: boolean;
    fields?: ("id" | "title" | "description" | "price" | "images")[];
    pageSize?: number;
}, {
    enabled?: boolean;
    fields?: ("id" | "title" | "description" | "price" | "images")[];
    pageSize?: number;
}>;
export declare const seoSettingsSchema: z.ZodObject<{
    aiCatalog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
        pageSize: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled?: boolean;
        fields?: ("id" | "title" | "description" | "price" | "images")[];
        pageSize?: number;
    }, {
        enabled?: boolean;
        fields?: ("id" | "title" | "description" | "price" | "images")[];
        pageSize?: number;
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
    alt?: string;
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
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
        pageSize: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled?: boolean;
        fields?: ("id" | "title" | "description" | "price" | "images")[];
        pageSize?: number;
    }, {
        enabled?: boolean;
        fields?: ("id" | "title" | "description" | "price" | "images")[];
        pageSize?: number;
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
    alt?: string;
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
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
        pageSize: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        enabled?: boolean;
        fields?: ("id" | "title" | "description" | "price" | "images")[];
        pageSize?: number;
    }, {
        enabled?: boolean;
        fields?: ("id" | "title" | "description" | "price" | "images")[];
        pageSize?: number;
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
    alt?: string;
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
export declare const shopSettingsSchema: z.ZodObject<{
    languages: z.ZodReadonly<z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">>;
    seo: z.ZodObject<{
        aiCatalog: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
            pageSize: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
        }, {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
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
        alt?: string;
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
            enabled: z.ZodBoolean;
            fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
            pageSize: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
        }, {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
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
        alt?: string;
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
            enabled: z.ZodBoolean;
            fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
            pageSize: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
        }, {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
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
        alt?: string;
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
    }, "strict", z.ZodTypeAny, {
        id?: string;
        enabled?: boolean;
        provider?: string;
    }, {
        id?: string;
        enabled?: boolean;
        provider?: string;
    }>>;
    /** Enabled tracking providers like UPS, DHL, etc. */
    trackingProviders: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
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
        enabled?: boolean;
        intervalMinutes?: number;
    }, {
        enabled?: boolean;
        intervalMinutes?: number;
    }>>;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
}, "strict", z.ZodTypeAny, {
    currency?: string;
    languages?: readonly ("en" | "de" | "it")[];
    seo?: {
        aiCatalog?: {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
        };
    } & {
        [k: string]: {
            title?: string;
            image?: string;
            description?: string;
            alt?: string;
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
    trackingProviders?: string[];
    freezeTranslations?: boolean;
    taxRegion?: string;
    depositService?: {
        enabled?: boolean;
        intervalMinutes?: number;
    };
    updatedAt?: string;
    updatedBy?: string;
}, {
    currency?: string;
    languages?: readonly ("en" | "de" | "it")[];
    seo?: {
        aiCatalog?: {
            enabled?: boolean;
            fields?: ("id" | "title" | "description" | "price" | "images")[];
            pageSize?: number;
        };
    } & {
        [k: string]: {
            title?: string;
            image?: string;
            description?: string;
            alt?: string;
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
    trackingProviders?: string[];
    freezeTranslations?: boolean;
    taxRegion?: string;
    depositService?: {
        enabled?: boolean;
        intervalMinutes?: number;
    };
    updatedAt?: string;
    updatedBy?: string;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
export type AiCatalogConfig = z.infer<typeof aiCatalogConfigSchema>;
export type AiCatalogField = z.infer<typeof aiCatalogFieldSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map