import plugin from "../index";
import type { PaymentRegistry } from "@acme/types";

describe("paypal plugin", () => {
  it("registerPayments adds paypal handler using default config when empty", () => {
    const registry: PaymentRegistry = {
      add: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
    };

    // calling with empty config should rely on plugin defaults
    plugin.registerPayments!(registry, {} as any);

    expect(registry.add).toHaveBeenCalledWith(
      "paypal",
      expect.objectContaining({
        processPayment: expect.any(Function),
      })
    );
  });
});
