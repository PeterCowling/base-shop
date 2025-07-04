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
    }>>;
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
    freezeTranslations: z.ZodOptional<z.ZodBoolean>;
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
    }>>;
    updatedAt: string;
    languages: readonly ("en" | "de" | "it")[];
    updatedBy: string;
    analytics?: {
        provider: string;
        id?: string | undefined;
    } | undefined;
    freezeTranslations?: boolean | undefined;
}, {
    seo: Partial<Record<"en" | "de" | "it", {
        title?: string | undefined;
        image?: string | undefined;
        description?: string | undefined;
        canonicalBase?: string | undefined;
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
    }>>;
    updatedAt: string;
    languages: readonly ("en" | "de" | "it")[];
    updatedBy: string;
    analytics?: {
        provider: string;
        id?: string | undefined;
    } | undefined;
    freezeTranslations?: boolean | undefined;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map