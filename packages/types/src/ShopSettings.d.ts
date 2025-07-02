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
            description?: string;
            image?: string;
            url?: string;
        }, {
            title?: string;
            description?: string;
            image?: string;
            url?: string;
        }>>;
        twitter: z.ZodOptional<z.ZodObject<{
            card: z.ZodOptional<z.ZodString>;
            title: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            image: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            title?: string;
            description?: string;
            image?: string;
            card?: string;
        }, {
            title?: string;
            description?: string;
            image?: string;
            card?: string;
        }>>;
        structuredData: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        canonicalBase?: string;
        title?: string;
        description?: string;
        image?: string;
        openGraph?: {
            title?: string;
            description?: string;
            image?: string;
            url?: string;
        };
        twitter?: {
            title?: string;
            description?: string;
            image?: string;
            card?: string;
        };
        structuredData?: string;
    }, {
        canonicalBase?: string;
        title?: string;
        description?: string;
        image?: string;
        openGraph?: {
            title?: string;
            description?: string;
            image?: string;
            url?: string;
        };
        twitter?: {
            title?: string;
            description?: string;
            image?: string;
            card?: string;
        };
        structuredData?: string;
    }>>;
    analytics: z.ZodOptional<z.ZodObject<{
        provider: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        provider?: string;
    }, {
        id?: string;
        provider?: string;
    }>>;
    freezeTranslations: z.ZodOptional<z.ZodBoolean>;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<Record<"en" | "de" | "it", {
        canonicalBase?: string;
        title?: string;
        description?: string;
        image?: string;
        openGraph?: {
            title?: string;
            description?: string;
            image?: string;
            url?: string;
        };
        twitter?: {
            title?: string;
            description?: string;
            image?: string;
            card?: string;
        };
        structuredData?: string;
    }>>;
    analytics?: {
        id?: string;
        provider?: string;
    };
    freezeTranslations?: boolean;
    updatedAt?: string;
    updatedBy?: string;
}, {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<Record<"en" | "de" | "it", {
        canonicalBase?: string;
        title?: string;
        description?: string;
        image?: string;
        openGraph?: {
            title?: string;
            description?: string;
            image?: string;
            url?: string;
        };
        twitter?: {
            title?: string;
            description?: string;
            image?: string;
            card?: string;
        };
        structuredData?: string;
    }>>;
    analytics?: {
        id?: string;
        provider?: string;
    };
    freezeTranslations?: boolean;
    updatedAt?: string;
    updatedBy?: string;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map