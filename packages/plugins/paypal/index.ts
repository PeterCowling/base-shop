// packages/plugins/paypal/index.ts
import type { Plugin, PaymentRegistry } from "@acme/platform-core/plugins";
import { z } from "zod";

const configSchema = z.object({
  clientId: z.string(),
  secret: z.string(),
});

type PayPalConfig = z.infer<typeof configSchema>;

const paypalPlugin: Plugin<any, any, any, PayPalConfig> = {
  id: "paypal",
  name: "PayPal",
  description: "Example PayPal payment provider",
  defaultConfig: { clientId: "", secret: "" },
  configSchema,
  registerPayments(registry: PaymentRegistry, _cfg: PayPalConfig) {
    registry.add("paypal", {
      async processPayment() {
        // placeholder implementation
        return { success: true };
      },
    });
  },
};

export default paypalPlugin;
