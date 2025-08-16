import "@acme/lib/initZod";
import { z } from "zod";
export declare const paymentEnvSchema: z.ZodObject<{
    STRIPE_SECRET_KEY: z.ZodString;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.ZodString;
    STRIPE_WEBHOOK_SECRET: z.ZodString;
}, "strip", z.ZodTypeAny, {
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
}, {
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
}>;
export declare const paymentEnv: {
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
};
export type PaymentEnv = z.infer<typeof paymentEnvSchema>;
//# sourceMappingURL=payments.d.ts.map