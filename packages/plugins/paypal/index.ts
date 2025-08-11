// packages/plugins/paypal/index.ts
import type { Plugin, PaymentRegistry } from "@acme/platform-core/plugins";

const paypalPlugin: Plugin = {
  id: "paypal",
  name: "PayPal",
  description: "Example PayPal payment provider",
  defaultConfig: { clientId: "", secret: "" },
  registerPayments(registry: PaymentRegistry) {
    registry.add("paypal", {
      async processPayment() {
        // placeholder implementation
        return { success: true };
      },
    });
  },
};

export default paypalPlugin;
