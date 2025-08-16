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
  carrier?: string;
  date?: string;
  window?: string;
}

interface PremierShippingRequest extends ShippingRequest {
  region: string;
  carrier: string;
  window: string;
}

interface PremierShippingConfig {
  regions: string[];
  windows: string[];
  carriers: string[];
  /** Optional flat rate applied when calculating shipping */
  rate?: number;
  /** Optional surcharge applied on top of the base rate */
  surcharge?: number;
  /** Optional label to display for the service */
  serviceLabel?: string;
}

interface PremierShippingProvider {
  calculateShipping(request: PremierShippingRequest): unknown;
  schedulePickup(
    region: string,
    carrier: string,
    date: string,
    hourWindow: string,
  ): void;
}

class PremierShipping implements PremierShippingProvider {
  private state: PremierPickupState = {};

  constructor(private cfg: PremierShippingConfig) {}

  calculateShipping(request: PremierShippingRequest) {
    const { region, carrier, window } = request;
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    if (!this.cfg.carriers.includes(carrier)) {
      throw new Error("Carrier not supported");
    }
    if (!this.cfg.windows.includes(window)) {
      throw new Error("Invalid delivery window");
    }
    const base = this.cfg.rate ?? 0;
    const surcharge = this.cfg.surcharge ?? 0;
    return {
      rate: base + surcharge,
      surcharge,
      serviceLabel: this.cfg.serviceLabel ?? "Premier Delivery",
    };
  }

  schedulePickup(
    region: string,
    carrier: string,
    date: string,
    hourWindow: string,
  ) {
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    if (!this.cfg.carriers.includes(carrier)) {
      throw new Error("Carrier not supported");
    }
    if (!this.cfg.windows.includes(hourWindow)) {
      throw new Error("Invalid delivery window");
    }
    this.state = { region, carrier, date, window: hourWindow };
  }
}

const premierShippingPlugin: Plugin<PremierShippingConfig, ShippingRequest, PremierShippingProvider> = {
  id: "premier-shipping",
  name: "Premier Shipping",
  defaultConfig: {
    regions: [],
    windows: [],
    carriers: [],
    rate: 0,
    surcharge: 0,
    serviceLabel: "Premier Delivery",
  },
  registerShipping(
    registry: ShippingRegistry<ShippingRequest, PremierShippingProvider>,
    cfg: PremierShippingConfig,
  ) {
    const provider = new PremierShipping(cfg);
    registry.add("premier-shipping", provider);
  },
};

export default premierShippingPlugin;
