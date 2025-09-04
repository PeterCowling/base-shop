import "@acme/zod-utils/initZod";
import { z } from "zod";

export const paymentsEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1).default("sk_test"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .default("pk_test"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default("whsec_test"),
});
// Allow disabling the payments gateway via an environment flag. When disabled
// we ignore any provided Stripe keys and fall back to schema defaults without
// emitting warnings.
const gateway = process.env.PAYMENTS_GATEWAY;
const rawEnv =
  gateway === "disabled"
    ? {}
    : {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      };

const parsed = paymentsEnvSchema.safeParse(rawEnv);
if (!parsed.success) {
  console.warn(
    "⚠️ Invalid payments environment variables:",
    parsed.error.format(),
  );
}

export const paymentsEnv = parsed.success
  ? parsed.data
  : paymentsEnvSchema.parse({});
export type PaymentsEnv = z.infer<typeof paymentsEnvSchema>;
