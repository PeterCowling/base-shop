import { z } from "zod";
export declare const shopSettingsSchema: z.ZodObject<{
    languages: z.ZodReadonly<z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">>;
    seo: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodObject<{
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
            title?: string;
            image?: string;
            description?: string;
            url?: string;
        }, {
            title?: string;
            image?: string;
            description?: string;
            url?: string;
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
            title?: string;
            image?: string;
            description?: string;
            url?: string;
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
            title?: string;
            image?: string;
            description?: string;
            url?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }>>;
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
    aiCatalog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        fields: string[];
    }, {
        enabled: boolean;
        fields: string[];
    }>>;
    depositService: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        interval: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        interval: number;
    }, {
        enabled: boolean;
        interval: number;
    }>>;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<Record<"en" | "de" | "it", {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            title?: string;
            image?: string;
            description?: string;
            url?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }>>;
    analytics?: {
        id?: string;
        enabled?: boolean;
        provider?: string;
    };
    freezeTranslations?: boolean;
    currency?: string;
    taxRegion?: string;
    aiCatalog?: {
        enabled: boolean;
        fields: string[];
    };
    depositService?: {
        enabled: boolean;
        interval: number;
    };
    updatedAt?: string;
    updatedBy?: string;
}, {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<Record<"en" | "de" | "it", {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
        openGraph?: {
            title?: string;
            image?: string;
            description?: string;
            url?: string;
        };
        twitter?: {
            title?: string;
            image?: string;
            description?: string;
            card?: string;
        };
        structuredData?: string;
    }>>;
    analytics?: {
        id?: string;
        enabled?: boolean;
        provider?: string;
    };
    freezeTranslations?: boolean;
    currency?: string;
    taxRegion?: string;
    aiCatalog?: {
        enabled: boolean;
        fields: string[];
    };
    depositService?: {
        enabled: boolean;
        interval: number;
    };
    updatedAt?: string;
    updatedBy?: string;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map