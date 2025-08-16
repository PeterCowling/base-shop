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
  carrier: string;
}

interface PremierShippingConfig {
  regions: string[];
  windows: string[];
  carriers?: string[];
  /** Optional flat rate applied when calculating shipping */
  rate?: number;
  /** Optional surcharge applied to premier delivery */
  surcharge?: number;
  /** Optional label describing the service */
  serviceLabel?: string;
}

interface PremierShippingProvider {
  calculateShipping(request: PremierShippingRequest): unknown;
  availableSlots(region: string, date: string): string[];
  schedulePickup(
    region: string,
    date: string,
    hourWindow: string,
    carrier: string,
  ): void;
}

class PremierShipping implements PremierShippingProvider {
  private reservations = new Map<string, Set<string>>();
  private state: PremierPickupState = {};

  constructor(private cfg: PremierShippingConfig) {}

  private assertSupported(region: string, window: string, carrier: string) {
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    if (!this.cfg.windows.includes(window)) {
      throw new Error("Invalid delivery window");
    }
    if (this.cfg.carriers && !this.cfg.carriers.includes(carrier)) {
      throw new Error("Carrier not supported");
    }
  }

  availableSlots(region: string, date: string) {
    if (!this.cfg.regions.includes(region)) {
      throw new Error("Region not supported");
    }
    const key = `${region}:${date}`;
    const reserved = this.reservations.get(key) ?? new Set();
    return this.cfg.windows.filter((w) => !reserved.has(w));
  }

  calculateShipping(request: PremierShippingRequest) {
    const { region, window, carrier } = request;
    this.assertSupported(region, window, carrier);
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
    date: string,
    hourWindow: string,
    carrier: string,
  ) {
    this.assertSupported(region, hourWindow, carrier);
    const key = `${region}:${date}`;
    const reserved = this.reservations.get(key) ?? new Set();
    if (reserved.has(hourWindow)) {
      throw new Error("Slot not available");
    }
    reserved.add(hourWindow);
    this.reservations.set(key, reserved);
    this.state = { region, date, window: hourWindow };
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
