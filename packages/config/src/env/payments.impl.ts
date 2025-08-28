import "@acme/zod-utils/initZod";
import { z } from "zod";

export const paymentEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1).default("sk_test"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .default("pk_test"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default("whsec_test"),
});

const parsed = paymentEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.warn(
    "⚠️ Invalid payment environment variables:",
    parsed.error.format(),
  );
}

export const paymentEnv = parsed.success
  ? parsed.data
  : paymentEnvSchema.parse({});
export type PaymentEnv = z.infer<typeof paymentEnvSchema>;
