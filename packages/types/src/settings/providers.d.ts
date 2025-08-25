import { z } from "zod";
export declare const providerSettingsSchema: z.ZodObject<{
    payment: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    shipping: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    payment: string[];
    shipping: string[];
}, {
    payment: string[];
    shipping: string[];
}>;
export type ProviderSettings = z.infer<typeof providerSettingsSchema>;
