// packages/plugins/paypal/index.ts
import { z } from "zod";

import type {
  PaymentPayload,
  PaymentRegistry,
  Plugin,
} from "@acme/types";

// Explicit .js extension for Node ESM runtime compatibility
import { processPaypalPayment } from "./paypalClient.js";

const configSchema = z
  .object({
    clientId: z.string(),
    secret: z.string(),
  })
  .strict();

type PayPalConfig = z.infer<typeof configSchema>;

const paypalPlugin: Plugin<PayPalConfig> = {
  id: "paypal",
  name: "PayPal", // i18n-exempt -- PAY-101 plugin metadata; not user-facing yet [ttl=2026-03-31]
  description: "Example PayPal payment provider", // i18n-exempt -- PAY-101 plugin metadata; not user-facing yet [ttl=2026-03-31]
  defaultConfig: { clientId: "", secret: "" },
  configSchema,
  registerPayments(registry: PaymentRegistry, _cfg: PayPalConfig) {
    registry.add("paypal", {
      async processPayment(payload: PaymentPayload) {
        return processPaypalPayment(payload);
      },
    });
  },
};

export default paypalPlugin;
