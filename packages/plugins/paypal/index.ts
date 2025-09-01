// packages/plugins/paypal/index.ts
import type {
  PaymentPayload,
  PaymentRegistry,
  Plugin,
} from "@acme/types";
import { z } from "zod";
import { processPaypalPayment } from "./paypalClient";

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
      async processPayment(payload: PaymentPayload) {
        return processPaypalPayment(payload);
      },
    });
  },
};

export default paypalPlugin;
