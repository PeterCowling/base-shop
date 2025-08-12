import { z } from "zod";
import { parseEnv } from "./utils";

export const paymentEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
});

export const paymentEnv = parseEnv(paymentEnvSchema);
export type PaymentEnv = z.infer<typeof paymentEnvSchema>;
