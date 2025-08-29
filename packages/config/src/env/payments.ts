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

const parsed = paymentsEnvSchema.safeParse(process.env);
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
