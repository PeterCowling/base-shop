// packages/config/src/env/shipping.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";

export const shippingEnvSchema = z.object({
  TAXJAR_KEY: z.string().optional(),
  UPS_KEY: z.string().optional(),
  DHL_KEY: z.string().optional(),
});

// ---------- loader (new) ----------
export function loadShippingEnv(
  raw: NodeJS.ProcessEnv = process.env
): ShippingEnv {
  const parsed = shippingEnvSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "❌ Invalid shipping environment variables:",
      parsed.error.format()
    );
    throw new Error("Invalid shipping environment variables");
  }
  return parsed.data;
}

// ---------- existing eager parse (kept for back-compat) ----------
const parsed = shippingEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid shipping environment variables:",
    parsed.error.format()
  );
  throw new Error("Invalid shipping environment variables");
}
export const shippingEnv = parsed.data;

export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
