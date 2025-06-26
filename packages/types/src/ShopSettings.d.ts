import { z } from "zod";
export declare const shopSettingsSchema: z.ZodObject<{
    languages: z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">;
}, "strip", z.ZodTypeAny, {
    languages?: ("en" | "de" | "it")[];
}, {
    languages?: ("en" | "de" | "it")[];
}>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map