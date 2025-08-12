import { z } from "zod";
import { parseEnv } from "./utils";

export const shippingEnvSchema = z.object({
  UPS_KEY: z.string().optional(),
  DHL_KEY: z.string().optional(),
});

export const shippingEnv = parseEnv(shippingEnvSchema);
export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
