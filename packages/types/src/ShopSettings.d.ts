import { z } from "zod";
export declare const aiCatalogFieldSchema: z.ZodEnum<["id", "title", "description", "price", "images"]>;
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
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        provider: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled?: boolean | undefined;
        provider: string;
        id?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        provider: string;
        id?: string | undefined;
    }>>;
    aiCatalog: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodBoolean;
        fields: z.ZodArray<z.ZodEnum<["id", "title", "description", "price", "images"]>, "many">;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "images")[];
    }, {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "images")[];
    }>>;
    freezeTranslations: z.ZodOptional<z.ZodBoolean>;
    currency: z.ZodOptional<z.ZodString>;
    taxRegion: z.ZodOptional<z.ZodString>;
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
    seo: Partial<Record<"en" | "de" | "it", {
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
    }>>;
    updatedAt: string;
    languages: readonly ("en" | "de" | "it")[];
    updatedBy: string;
    analytics?: {
        enabled?: boolean | undefined;
        provider: string;
        id?: string | undefined;
    } | undefined;
    aiCatalog?: {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "images")[];
    } | undefined;
    freezeTranslations?: boolean | undefined;
    currency?: string | undefined;
    taxRegion?: string | undefined;
    depositService?: {
        enabled: boolean;
        interval: number;
    } | undefined;
}, {
    seo: Partial<Record<"en" | "de" | "it", {
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
    }>>;
    updatedAt: string;
    languages: readonly ("en" | "de" | "it")[];
    updatedBy: string;
    analytics?: {
        enabled?: boolean | undefined;
        provider: string;
        id?: string | undefined;
    } | undefined;
    aiCatalog?: {
        enabled: boolean;
        fields: ("id" | "title" | "description" | "price" | "images")[];
    } | undefined;
    freezeTranslations?: boolean | undefined;
    currency?: string | undefined;
    taxRegion?: string | undefined;
    depositService?: {
        enabled: boolean;
        interval: number;
    } | undefined;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
export type AiCatalogField = z.infer<typeof aiCatalogFieldSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map
