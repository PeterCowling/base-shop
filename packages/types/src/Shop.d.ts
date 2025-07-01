import { z } from "zod";
import { type Locale } from "./Product";
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
export interface Shop {
    id: string;
    name: string;
    catalogFilters: string[];
    themeId: string;
    /** Mapping of design tokens to theme values */
    themeTokens: Record<string, string>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: Record<string, string>;
    /** Optional price overrides per locale (minor units) */
    priceOverrides: Partial<Record<Locale, number>>;
    /** Optional redirect overrides for locale detection */
    localeOverrides: Record<string, Locale>;
}
export declare const shopSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    catalogFilters: z.ZodArray<z.ZodString, "many">;
    themeId: z.ZodString;
    /** Mapping of design tokens to theme values */
    themeTokens: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Optional price overrides per locale (minor units) */
    priceOverrides: z.ZodDefault<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodNumber>>;
    /** Optional redirect overrides for locale detection */
    localeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodEnum<["en", "de", "it"]>>>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    name?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides?: Record<string, "en" | "de" | "it">;
}, {
    id?: string;
    name?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides?: Record<string, "en" | "de" | "it">;
}>;
//# sourceMappingURL=Shop.d.ts.map