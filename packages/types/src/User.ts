import { z } from "zod";

export const userSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    passwordHash: z.string(),
    role: z.string(),
    resetToken: z.string().nullable(),
    resetTokenExpiresAt: z.date().nullable(),
    emailVerified: z.boolean(),
    stripeSubscriptionId: z.string().nullable().optional(),
  })
  .strict();

export type User = z.infer<typeof userSchema>;

