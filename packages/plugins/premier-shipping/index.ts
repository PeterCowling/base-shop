// packages/plugins/premier-shipping/index.ts
//
// Shops that do not offer luxury models can omit this plugin by removing
// "premier-shipping" from their `shippingProviders` configuration.
import type {
  Plugin,
  PaymentPayload,
  PaymentProvider,
  ShippingRegistry,
  ShippingRequest,
  ShippingProvider,
  WidgetProps,
} from "@acme/types";

interface PremierPickupState {
  region?: string;
  date?: string;
  window?: string;
}

interface PremierShippingRequest extends ShippingRequest {
  region: string;
  window: string;
  carrier?: string;
}

interface PremierShippingConfig {
  regions: string[];
  windows: string[];
  /** Carriers that support one-hour delivery windows */
  carriers: string[];
  /** Optional flat rate applied when calculating shipping */
  rate?: number;
  /** Additional surcharge for premier delivery */
  surcharge?: number;
  /** Optional label describing the service */
  serviceLabel?: string;
}

interface PremierShippingProvider extends ShippingProvider<PremierShippingRequest> {
  calculateShipping(request: PremierShippingRequest): unknown;
  getAvailableSlots(region: string): { windows: string[]; carriers: string[] };
  schedulePickup(
    region: string,
    date: string,
    hourWindow: string,
    carrier?: string,
  ): void;
}

class PremierShipping implements PremierShippingProvider {
  private state: PremierPickupState = {};

  constructor(private cfg: PremierShippingConfig) {}

  calculateShipping(request: PremierShippingRequest) {
    const { region, window, carrier } = request;
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    if (!this.cfg.windows.includes(window)) {
      throw new Error("Invalid delivery window");
    }
    if (carrier && !this.cfg.carriers.includes(carrier)) {
      throw new Error("Carrier not supported");
    }
    const base = this.cfg.rate ?? 0;
    const surcharge = this.cfg.surcharge ?? 0;
    return {
      rate: base + surcharge,
      surcharge,
      serviceLabel: this.cfg.serviceLabel ?? "Premier Delivery",
    };
  }

  getAvailableSlots(region: string) {
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    return { windows: this.cfg.windows, carriers: this.cfg.carriers };
  }

  schedulePickup(
    region: string,
    date: string,
    hourWindow: string,
    carrier?: string,
  ) {
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    if (!this.cfg.windows.includes(hourWindow)) {
      throw new Error("Invalid delivery window");
    }
    if (carrier && !this.cfg.carriers.includes(carrier)) {
      throw new Error("Carrier not supported");
    }
    this.state = { region, date, window: hourWindow };
  }
}

const premierShippingPlugin: Plugin<
  PremierShippingConfig,
  PaymentPayload,
  PremierShippingRequest,
  WidgetProps,
  PaymentProvider<PaymentPayload>,
  PremierShippingProvider
> = {
  id: "premier-shipping",
  name: "Premier Shipping",
  defaultConfig: { regions: [], windows: [], carriers: [], rate: 0, surcharge: 0 },
  registerShipping(
    registry: ShippingRegistry<PremierShippingRequest, PremierShippingProvider>,
    cfg: PremierShippingConfig,
  ) {
    const provider = new PremierShipping(cfg);
    registry.add("premier-shipping", provider);
  },
};

export default premierShippingPlugin;
