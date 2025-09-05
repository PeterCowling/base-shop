import { z } from "zod";
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    passwordHash: z.ZodString;
    role: z.ZodString;
    resetToken: z.ZodNullable<z.ZodString>;
    resetTokenExpiresAt: z.ZodNullable<z.ZodDate>;
    emailVerified: z.ZodBoolean;
    stripeSubscriptionId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    resetToken: string | null;
    resetTokenExpiresAt: Date | null;
    emailVerified: boolean;
    stripeSubscriptionId?: string | null | undefined;
}, {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    resetToken: string | null;
    resetTokenExpiresAt: Date | null;
    emailVerified: boolean;
    stripeSubscriptionId?: string | null | undefined;
}>;
export type User = z.infer<typeof userSchema>;

