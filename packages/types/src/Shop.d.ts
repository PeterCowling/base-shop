import { z } from "zod";
export declare const shopSeoFieldsSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string;
    image?: string;
    description?: string;
}, {
    title?: string;
    image?: string;
    description?: string;
}>;
export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;
export declare const shopSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    catalogFilters: z.ZodArray<z.ZodString, "many">;
    themeId: z.ZodString;
    /** Mapping of design tokens to theme values */
    themeTokens: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    name?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
}, {
    id?: string;
    name?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
}>;
export type Shop = z.infer<typeof shopSchema>;
