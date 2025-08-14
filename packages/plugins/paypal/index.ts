// packages/plugins/paypal/index.ts
import type {
  PaymentPayload,
  PaymentRegistry,
  Plugin,
} from "@acme/platform-core/plugins";
import { z } from "zod";

const configSchema = z
  .object({
    clientId: z.string(),
    secret: z.string(),
  })
  .strict();

type PayPalConfig = z.infer<typeof configSchema>;

const paypalPlugin: Plugin<PayPalConfig> = {
  id: "paypal",
  name: "PayPal",
  description: "Example PayPal payment provider",
  defaultConfig: { clientId: "", secret: "" },
  configSchema,
  registerPayments(registry: PaymentRegistry, _cfg: PayPalConfig) {
    registry.add("paypal", {
      async processPayment(_payload: PaymentPayload) {
        // placeholder implementation
        return { success: true };
      },
    });
  },
};

export default paypalPlugin;
