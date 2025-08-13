// packages/plugins/premier-shipping/index.ts
import type { Plugin, ShippingRegistry } from "@acme/platform-core/plugins";
import { z } from "zod";

const configSchema = z
  .object({
    regions: z.array(z.string()).default([]),
    hourWindows: z.array(z.string()).default([]),
  })
  .strict();

export type PremierConfig = z.infer<typeof configSchema>;

export interface PremierShippingProvider {
  calculateShipping(...args: any[]): Promise<unknown> | unknown;
  schedulePickup(region: string, date: string, hourWindow: string): void;
  lastPickup?: { region: string; date: string; hourWindow: string };
}

const premierPlugin: Plugin<any, PremierShippingProvider, any, PremierConfig> = {
  id: "premier-shipping",
  name: "Premier Shipping",
  description: "Premium shipping with scheduled pickup",
  defaultConfig: { regions: [], hourWindows: [] },
  configSchema,
  registerShipping(registry: ShippingRegistry<PremierShippingProvider>, _cfg: PremierConfig) {
    const provider: PremierShippingProvider = {
      calculateShipping() {
        return { rate: 0 };
      },
      schedulePickup(region, date, hourWindow) {
        provider.lastPickup = { region, date, hourWindow };
      },
    };
    registry.add("premier-shipping", provider);
  },
};

export default premierPlugin;
