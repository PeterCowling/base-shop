import { z } from "zod";
export declare const shopSettingsSchema: z.ZodObject<{
    languages: z.ZodReadonly<z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">>;
    seo: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodObject<{
        canonicalBase: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
    }, {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
    }>>;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<Record<"en" | "de" | "it", {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
    }>>;
    updatedAt?: string;
    updatedBy?: string;
}, {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<Record<"en" | "de" | "it", {
        title?: string;
        image?: string;
        description?: string;
        canonicalBase?: string;
    }>>;
    updatedAt?: string;
    updatedBy?: string;
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map