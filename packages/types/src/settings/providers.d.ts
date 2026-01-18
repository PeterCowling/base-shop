import { z } from "zod";
export declare const providerSettingsSchema: z.ZodObject<{
    payment: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    billingProvider: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    shipping: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    payment: string[];
    billingProvider: string;
    shipping: string[];
}, {
    payment?: string[] | undefined;
    billingProvider?: string | undefined;
    shipping?: string[] | undefined;
}>;
export type ProviderSettings = z.infer<typeof providerSettingsSchema>;
//# sourceMappingURL=providers.d.ts.map