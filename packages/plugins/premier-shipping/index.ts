// packages/plugins/premier-shipping/index.ts
//
// Shops that do not offer luxury models can omit this plugin by removing
// "premier-shipping" from their `shippingProviders` configuration.
import type {
  Plugin,
  ShippingRegistry,
  ShippingRequest,
} from "@acme/types";

interface PremierPickupState {
  region?: string;
  date?: string;
  window?: string;
}

interface PremierShippingRequest extends ShippingRequest {
  region: string;
  window: string;
}

interface PremierShippingConfig {
  regions: string[];
  windows: string[];
  /** Optional flat rate applied when calculating shipping */
  rate?: number;
}

interface PremierShippingProvider {
  calculateShipping(request: PremierShippingRequest): unknown;
  schedulePickup(region: string, date: string, hourWindow: string): void;
}

class PremierShipping implements PremierShippingProvider {
  private state: PremierPickupState = {};

  constructor(private cfg: PremierShippingConfig) {}

  calculateShipping(request: PremierShippingRequest) {
    const { region, window } = request;
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    if (!this.cfg.windows.includes(window)) {
      throw new Error("Invalid delivery window");
    }
    return { rate: this.cfg.rate ?? 0 };
  }

  schedulePickup(region: string, date: string, hourWindow: string) {
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    if (!this.cfg.windows.includes(hourWindow)) {
      throw new Error("Invalid delivery window");
    }
    this.state = { region, date, window: hourWindow };
  }
}

const premierShippingPlugin: Plugin<PremierShippingConfig, ShippingRequest, PremierShippingProvider> = {
  id: "premier-shipping",
  name: "Premier Shipping",
  defaultConfig: { regions: [], windows: [], rate: 0 },
  registerShipping(
    registry: ShippingRegistry<ShippingRequest, PremierShippingProvider>,
    cfg: PremierShippingConfig,
  ) {
    const provider = new PremierShipping(cfg);
    registry.add("premier-shipping", provider);
  },
};

export default premierShippingPlugin;
