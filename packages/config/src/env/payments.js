import "@acme/zod-utils/initZod";
import { z } from "zod";
export const paymentEnvSchema = z.object({
    STRIPE_SECRET_KEY: z.string().min(1),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
});
const parsed = paymentEnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid payment environment variables:", parsed.error.format());
    throw new Error("Invalid payment environment variables");
}
export const paymentEnv = parsed.data;
