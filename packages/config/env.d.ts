import { z } from "zod";
export declare const envSchema: z.ZodObject<{
    STRIPE_SECRET_KEY: z.ZodString;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.ZodString;
    NEXTAUTH_SECRET: z.ZodOptional<z.ZodString>;
    PREVIEW_TOKEN_SECRET: z.ZodOptional<z.ZodString>;
    NODE_ENV: z.ZodOptional<z.ZodString>;
    OUTPUT_EXPORT: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_PHASE: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_DEFAULT_SHOP: z.ZodOptional<z.ZodString>;
    NEXT_PUBLIC_SHOP_ID: z.ZodOptional<z.ZodString>;
    GMAIL_USER: z.ZodOptional<z.ZodString>;
    GMAIL_PASS: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    NEXTAUTH_SECRET?: string | undefined;
    PREVIEW_TOKEN_SECRET?: string | undefined;
    NODE_ENV?: string | undefined;
    OUTPUT_EXPORT?: string | undefined;
    NEXT_PUBLIC_PHASE?: string | undefined;
    NEXT_PUBLIC_DEFAULT_SHOP?: string | undefined;
    NEXT_PUBLIC_SHOP_ID?: string | undefined;
    GMAIL_USER?: string | undefined;
    GMAIL_PASS?: string | undefined;
}, {
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    NEXTAUTH_SECRET?: string | undefined;
    PREVIEW_TOKEN_SECRET?: string | undefined;
    NODE_ENV?: string | undefined;
    OUTPUT_EXPORT?: string | undefined;
    NEXT_PUBLIC_PHASE?: string | undefined;
    NEXT_PUBLIC_DEFAULT_SHOP?: string | undefined;
    NEXT_PUBLIC_SHOP_ID?: string | undefined;
    GMAIL_USER?: string | undefined;
    GMAIL_PASS?: string | undefined;
}>;
export declare const env: {
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    NEXTAUTH_SECRET?: string | undefined;
    PREVIEW_TOKEN_SECRET?: string | undefined;
    NODE_ENV?: string | undefined;
    OUTPUT_EXPORT?: string | undefined;
    NEXT_PUBLIC_PHASE?: string | undefined;
    NEXT_PUBLIC_DEFAULT_SHOP?: string | undefined;
    NEXT_PUBLIC_SHOP_ID?: string | undefined;
    GMAIL_USER?: string | undefined;
    GMAIL_PASS?: string | undefined;
};
export type Env = z.infer<typeof envSchema>;
//# sourceMappingURL=env.d.ts.map