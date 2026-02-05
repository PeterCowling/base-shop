import type { PaymentRegistry } from "@acme/types";

jest.mock("../paypalClient", () => ({
  processPaypalPayment: jest.fn(),
}));

// eslint-disable-next-line import/first -- Must come after jest.mock for proper hoisting
import plugin from "../index";
// eslint-disable-next-line import/first -- Must come after jest.mock for proper hoisting
import { processPaypalPayment } from "../paypalClient";

const mockProcessPaypalPayment = processPaypalPayment as jest.Mock;

describe("paypal plugin", () => {
  it("parses valid custom config", () => {
    const cfg = { clientId: "abc", secret: "xyz" };
    expect(plugin.configSchema!.parse(cfg)).toEqual(cfg);
  });

  it("rejects missing clientId/secret", () => {
    expect(plugin.configSchema!.safeParse({}).success).toBe(false);
    expect(plugin.configSchema!.safeParse({ clientId: "abc" }).success).toBe(
      false
    );
    expect(plugin.configSchema!.safeParse({ secret: "xyz" }).success).toBe(
      false
    );
  });

  it("rejects unknown config fields", () => {
    const result = plugin.configSchema!.safeParse({
      clientId: "abc",
      secret: "xyz",
      extra: "nope",
    } as any);
    expect(result.success).toBe(false);
  });

  it("registerPayments adds paypal handler using provided config", () => {
    const registry: PaymentRegistry = {
      add: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
    };

    const cfg = plugin.configSchema!.parse({
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
      const cfg = plugin.configSchema!.parse({ clientId: "abc" } as any);
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

  describe("processPayment", () => {
    const registry: PaymentRegistry = {
      add: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
    };

    plugin.registerPayments!(registry, { clientId: "abc", secret: "xyz" });
    const provider = (registry.add as jest.Mock).mock.calls[0][1];

    afterEach(() => {
      mockProcessPaypalPayment.mockReset();
    });

    it("returns success for valid payload", async () => {
      mockProcessPaypalPayment.mockResolvedValueOnce({ success: true });

      await expect(
        provider.processPayment({ amount: 100 } as any),
      ).resolves.toEqual({ success: true });

      expect(processPaypalPayment).toHaveBeenCalledWith({ amount: 100 });
    });

    it("propagates errors for invalid payload", async () => {
      const err = new Error("boom");
      mockProcessPaypalPayment.mockRejectedValueOnce(err);

      await expect(
        provider.processPayment({} as any),
      ).rejects.toThrow(err);
    });

    it("handles invalid credentials errors", async () => {
      const err = new Error("Invalid credentials");
      mockProcessPaypalPayment.mockRejectedValueOnce(err);

      await expect(
        provider.processPayment({ amount: 50 } as any),
      ).rejects.toThrow("Invalid credentials");
    });

    it("handles network failures", async () => {
      const err = new Error("Network error");
      mockProcessPaypalPayment.mockRejectedValueOnce(err);

      await expect(
        provider.processPayment({ amount: 50 } as any),
      ).rejects.toThrow("Network error");
    });
  });
});
