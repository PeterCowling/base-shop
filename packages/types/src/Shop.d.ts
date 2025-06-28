import { z } from "zod";
export declare const shopSeoFieldsSchema: z.ZodObject<{
    canonicalBase: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    canonicalBase?: string;
    title?: string;
    description?: string;
    image?: string;
}, {
    canonicalBase?: string;
    title?: string;
    description?: string;
    image?: string;
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
//# sourceMappingURL=Shop.d.ts.map