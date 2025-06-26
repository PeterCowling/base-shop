import { z } from "zod";
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