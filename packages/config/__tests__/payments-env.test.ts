import { describe, expect, it, jest } from "@jest/globals";
import { loadPaymentsEnv, paymentsEnvSchema } from "../src/env/payments";

describe("payments env", () => {
  it("parses defaults when gateway disabled", () => {
    const env = loadPaymentsEnv({ PAYMENTS_GATEWAY: "disabled" } as any);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
  });

  it("throws for unsupported provider", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({ PAYMENTS_PROVIDER: "foo" } as any),
    ).toThrow("Invalid payments environment variables");
    expect(err).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "foo",
    );
    err.mockRestore();
  });

  describe("stripe provider", () => {
    it("errors when STRIPE_SECRET_KEY missing", () => {
      const err = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() =>
        loadPaymentsEnv({
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_WEBHOOK_SECRET: "wh",
        } as any),
      ).toThrow("Invalid payments environment variables");
      expect(err).toHaveBeenCalledWith(
        "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
      );
      err.mockRestore();
    });

    it("errors when STRIPE_WEBHOOK_SECRET missing", () => {
      const err = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() =>
        loadPaymentsEnv({
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_SECRET_KEY: "sk",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        } as any),
      ).toThrow("Invalid payments environment variables");
      expect(err).toHaveBeenCalledWith(
        "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
      );
      err.mockRestore();
    });

    it("succeeds with valid keys", () => {
      const env = loadPaymentsEnv({
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_live",
        STRIPE_WEBHOOK_SECRET: "whsec_live",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
      } as any);
      expect(env).toMatchObject({
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_live",
        STRIPE_WEBHOOK_SECRET: "whsec_live",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
      });
    });
  });

  it("returns defaults on invalid schema", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({ PAYMENTS_CURRENCY: "usd" } as any);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warn).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    warn.mockRestore();
  });
});

