import { z } from "zod";
import "@acme/lib/initZod";

export const paymentEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
});


const parsed = paymentEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid payment environment variables:",
    parsed.error.format(),
  );
  process.exit(1);
}

export const paymentEnv = parsed.data;
export type PaymentEnv = z.infer<typeof paymentEnvSchema>;
