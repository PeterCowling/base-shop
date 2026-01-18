import "@acme/zod-utils/initZod";
import { z } from "zod";
export declare const shippingEnvSchema: z.ZodEffects<z.ZodObject<{
    TAXJAR_KEY: z.ZodOptional<z.ZodString>;
    UPS_KEY: z.ZodOptional<z.ZodString>;
    DHL_KEY: z.ZodOptional<z.ZodString>;
    SHIPPING_PROVIDER: z.ZodOptional<z.ZodEnum<["none", "external", "shippo", "ups", "dhl"]>>;
    ALLOWED_COUNTRIES: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodString, "many">>, string[] | undefined, unknown>;
    LOCAL_PICKUP_ENABLED: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>, string | undefined, unknown>, boolean | undefined, unknown>;
    DEFAULT_COUNTRY: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>, string | undefined, unknown>;
    DEFAULT_SHIPPING_ZONE: z.ZodOptional<z.ZodEnum<["domestic", "eu", "international"]>>;
    FREE_SHIPPING_THRESHOLD: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
}, "strip", z.ZodTypeAny, {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
    SHIPPING_PROVIDER?: "external" | "none" | "shippo" | "ups" | "dhl" | undefined;
    ALLOWED_COUNTRIES?: string[] | undefined;
    LOCAL_PICKUP_ENABLED?: boolean | undefined;
    DEFAULT_COUNTRY?: string | undefined;
    DEFAULT_SHIPPING_ZONE?: "domestic" | "eu" | "international" | undefined;
    FREE_SHIPPING_THRESHOLD?: number | undefined;
}, {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
    SHIPPING_PROVIDER?: "external" | "none" | "shippo" | "ups" | "dhl" | undefined;
    ALLOWED_COUNTRIES?: unknown;
    LOCAL_PICKUP_ENABLED?: unknown;
    DEFAULT_COUNTRY?: unknown;
    DEFAULT_SHIPPING_ZONE?: "domestic" | "eu" | "international" | undefined;
    FREE_SHIPPING_THRESHOLD?: unknown;
}>, {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
    SHIPPING_PROVIDER?: "external" | "none" | "shippo" | "ups" | "dhl" | undefined;
    ALLOWED_COUNTRIES?: string[] | undefined;
    LOCAL_PICKUP_ENABLED?: boolean | undefined;
    DEFAULT_COUNTRY?: string | undefined;
    DEFAULT_SHIPPING_ZONE?: "domestic" | "eu" | "international" | undefined;
    FREE_SHIPPING_THRESHOLD?: number | undefined;
}, {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
    SHIPPING_PROVIDER?: "external" | "none" | "shippo" | "ups" | "dhl" | undefined;
    ALLOWED_COUNTRIES?: unknown;
    LOCAL_PICKUP_ENABLED?: unknown;
    DEFAULT_COUNTRY?: unknown;
    DEFAULT_SHIPPING_ZONE?: "domestic" | "eu" | "international" | undefined;
    FREE_SHIPPING_THRESHOLD?: unknown;
}>;
export declare function loadShippingEnv(raw?: NodeJS.ProcessEnv): ShippingEnv;
export declare const shippingEnv: {
    TAXJAR_KEY?: string | undefined;
    UPS_KEY?: string | undefined;
    DHL_KEY?: string | undefined;
    SHIPPING_PROVIDER?: "external" | "none" | "shippo" | "ups" | "dhl" | undefined;
    ALLOWED_COUNTRIES?: string[] | undefined;
    LOCAL_PICKUP_ENABLED?: boolean | undefined;
    DEFAULT_COUNTRY?: string | undefined;
    DEFAULT_SHIPPING_ZONE?: "domestic" | "eu" | "international" | undefined;
    FREE_SHIPPING_THRESHOLD?: number | undefined;
};
export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
