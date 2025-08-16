import "@acme/lib/initZod";
import { z } from "zod";
export declare const shippingEnvSchema: z.ZodObject<{
    TAXJAR_KEY: z.ZodOptional<z.ZodString>;
    UPS_KEY: z.ZodOptional<z.ZodString>;
    DHL_KEY: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
}, {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
}>;
export declare const shippingEnv: {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
};
export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
//# sourceMappingURL=shipping.d.ts.map