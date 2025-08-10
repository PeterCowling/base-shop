import { localeSchema } from "@types";
import { z } from "zod";
export declare const productSchema: z.ZodObject<{
    id: z.ZodString;
    price: z.ZodEffects<z.ZodNumber, number, string | number>;
    title: z.ZodRecord<typeof localeSchema, z.ZodString>;
    description: z.ZodRecord<typeof localeSchema, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    price: number;
    title: Record<z.infer<typeof localeSchema>, string>;
    description: Record<z.infer<typeof localeSchema>, string>;
}, {
    id: string;
    price: string | number;
    title: Record<z.infer<typeof localeSchema>, string>;
    description: Record<z.infer<typeof localeSchema>, string>;
}>;
export declare const shopSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    themeId: z.ZodString;
    catalogFilters: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, string[], string | undefined>;
    themeTokens: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, Record<string, unknown>, string | undefined>;
    filterMappings: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, Record<string, unknown>, string | undefined>;
    priceOverrides: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, Record<string, unknown>, string | undefined>;
    localeOverrides: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodString>>, Record<string, unknown>, string | undefined>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    themeId: string;
    catalogFilters: string[];
    themeTokens?: Record<string, unknown>;
    filterMappings?: Record<string, unknown>;
    priceOverrides?: Record<string, unknown>;
    localeOverrides?: Record<string, unknown>;
}, {
    id: string;
    name: string;
    themeId: string;
    catalogFilters?: string | undefined;
    themeTokens?: string | undefined;
    filterMappings?: string | undefined;
    priceOverrides?: string | undefined;
    localeOverrides?: string | undefined;
}>;
export type ProductForm = z.infer<typeof productSchema>;
export type ShopForm = z.infer<typeof shopSchema>;
//# sourceMappingURL=schemas.d.ts.map