import { z } from "zod";
import { applyFriendlyZodMessages } from "@acme/lib";

export const shippingEnvSchema = z.object({
  UPS_KEY: z.string().optional(),
  DHL_KEY: z.string().optional(),
});

applyFriendlyZodMessages();

const parsed = shippingEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274c Invalid shipping environment variables:", parsed.error.format());
  process.exit(1);
}

export const shippingEnv = parsed.data;
export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
