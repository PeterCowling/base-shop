import { z } from "zod";
export declare const shopLocaleSchema: z.ZodObject<{
    priceOverrides: z.ZodDefault<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodNumber>>;
    localeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodEnum<["en", "de", "it"]>>>;
    homeTitle: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    homeDescription: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    priceOverrides: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides: Record<string, "en" | "de" | "it">;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
}, {
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>> | undefined;
    localeOverrides?: Record<string, "en" | "de" | "it"> | undefined;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
}>;
export type ShopLocale = z.infer<typeof shopLocaleSchema>;
//# sourceMappingURL=shop-locale.d.ts.map