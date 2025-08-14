// packages/plugins/premier-shipping/index.ts
//
// Shops that do not offer luxury models can omit this plugin by removing
// "premier-shipping" from their `shippingProviders` configuration.
import type {
  Plugin,
  ShippingRegistry,
  ShippingRequest,
} from "@acme/platform-core/plugins";

interface PremierPickupState {
  region?: string;
  date?: string;
  window?: string;
}
interface PremierShippingProvider {
  calculateShipping(request: ShippingRequest): unknown;
  schedulePickup(region: string, date: string, hourWindow: string): void;
}

class PremierShipping implements PremierShippingProvider {
  private state: PremierPickupState = {};

  calculateShipping(_request: ShippingRequest) {
    // placeholder implementation
    return { rate: 0 };
  }

  schedulePickup(region: string, date: string, hourWindow: string) {
    this.state = { region, date, window: hourWindow };
  }
}

const provider = new PremierShipping();

const premierShippingPlugin: Plugin = {
  id: "premier-shipping",
  name: "Premier Shipping",
  registerShipping(
    registry: ShippingRegistry<ShippingRequest, PremierShippingProvider>,
  ) {
    registry.add("premier-shipping", provider);
  },
};

export default premierShippingPlugin;
