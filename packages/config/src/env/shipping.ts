import { z } from "zod";
import "@acme/lib/initZod";

export const shippingEnvSchema = z.object({
  TAXJAR_KEY: z.string().optional(),
  UPS_KEY: z.string().optional(),
  DHL_KEY: z.string().optional(),
});


const parsed = shippingEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid shipping environment variables:",
    parsed.error.format(),
  );
  process.exit(1);
}

export const shippingEnv = parsed.data;
export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
