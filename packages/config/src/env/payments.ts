import { z } from "zod";
import { applyFriendlyZodMessages } from "@acme/lib";

export const paymentEnvSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  TAXJAR_KEY: z.string().optional(),
});

applyFriendlyZodMessages();

const parsed = paymentEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274c Invalid payment environment variables:", parsed.error.format());
  process.exit(1);
}

export const paymentEnv = parsed.data;
export type PaymentEnv = z.infer<typeof paymentEnvSchema>;
