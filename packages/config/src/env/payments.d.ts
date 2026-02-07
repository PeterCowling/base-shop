import "@acme/zod-utils/initZod";

import { z } from "zod";

export declare const paymentsEnvSchema: z.ZodObject<{
    PAYMENTS_PROVIDER: z.ZodOptional<z.ZodEnum<["stripe"]>>;
    PAYMENTS_SANDBOX: z.ZodEffects<z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>, boolean, string | undefined>;
    PAYMENTS_CURRENCY: z.ZodEffects<z.ZodDefault<z.ZodString>, string, string | undefined>;
    STRIPE_SECRET_KEY: z.ZodDefault<z.ZodString>;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.ZodDefault<z.ZodString>;
    STRIPE_WEBHOOK_SECRET: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    PAYMENTS_SANDBOX: boolean;
    PAYMENTS_CURRENCY: string;
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    PAYMENTS_PROVIDER?: "stripe" | undefined;
}, {
    PAYMENTS_PROVIDER?: "stripe" | undefined;
    PAYMENTS_SANDBOX?: string | undefined;
    PAYMENTS_CURRENCY?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
}>;
export type PaymentsEnv = z.infer<typeof paymentsEnvSchema>;
export declare function loadPaymentsEnv(raw?: NodeJS.ProcessEnv): PaymentsEnv;
export declare const paymentsEnv: {
    PAYMENTS_SANDBOX: boolean;
    PAYMENTS_CURRENCY: string;
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    PAYMENTS_PROVIDER?: "stripe" | undefined;
};
