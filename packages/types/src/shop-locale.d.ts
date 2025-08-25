import { z } from "zod";
export declare const shopLocaleSchema: z.ZodObject<{
    priceOverrides: z.ZodDefault<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodNumber>>;
    localeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodEnum<["en", "de", "it"]>>>;
    homeTitle: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    homeDescription: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    homeTitle?: Record<"en" | "de" | "it", string> | undefined;
    homeDescription?: Record<"en" | "de" | "it", string> | undefined;
    priceOverrides: Record<"en" | "de" | "it", number>;
    localeOverrides: Record<string, "en" | "de" | "it">;
}, {
    homeTitle?: Record<"en" | "de" | "it", string> | undefined;
    homeDescription?: Record<"en" | "de" | "it", string> | undefined;
    priceOverrides: Record<"en" | "de" | "it", number>;
    localeOverrides: Record<string, "en" | "de" | "it">;
}>;
export type ShopLocale = z.infer<typeof shopLocaleSchema>;
