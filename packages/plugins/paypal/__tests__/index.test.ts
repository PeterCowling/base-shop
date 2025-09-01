import plugin from "../index";
import type { PaymentRegistry } from "@acme/types";

describe("paypal plugin", () => {
  it("parses valid custom config", () => {
    const cfg = { clientId: "abc", secret: "xyz" };
    expect(plugin.configSchema.parse(cfg)).toEqual(cfg);
  });

  it("rejects missing clientId/secret", () => {
    expect(plugin.configSchema.safeParse({}).success).toBe(false);
    expect(plugin.configSchema.safeParse({ clientId: "abc" }).success).toBe(
      false
    );
    expect(plugin.configSchema.safeParse({ secret: "xyz" }).success).toBe(
      false
    );
  });

  it("registerPayments adds paypal handler using provided config", () => {
    const registry: PaymentRegistry = {
      add: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
    };

    const cfg = plugin.configSchema.parse({
      clientId: "abc",
      secret: "xyz",
    });

    plugin.registerPayments!(registry, cfg);

    expect(registry.add).toHaveBeenCalledWith(
      "paypal",
      expect.objectContaining({
        processPayment: expect.any(Function),
      })
    );
  });

  it("throws when given invalid config", () => {
    const registry: PaymentRegistry = {
      add: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
    };

    expect(() => {
      const cfg = plugin.configSchema.parse({ clientId: "abc" } as any);
      plugin.registerPayments!(registry, cfg);
    }).toThrow();

    expect(registry.add).not.toHaveBeenCalled();
  });

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
