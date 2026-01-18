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
}>;
export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;
//# sourceMappingURL=shop-seo.d.ts.map