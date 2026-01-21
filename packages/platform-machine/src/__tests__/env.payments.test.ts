import { describe, expect, it, jest } from "@jest/globals";

import { loadPaymentsEnv } from "@acme/config/env/payments";

describe("payments env", () => {
  it("returns defaults when gateway disabled", () => {
    const env = loadPaymentsEnv({ PAYMENTS_GATEWAY: "disabled" } as any);
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test");
    expect(env.PAYMENTS_SANDBOX).toBe(true);
  });

  it("parses stripe provider with keys", () => {
    const env = loadPaymentsEnv({
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live",
      STRIPE_WEBHOOK_SECRET: "whsec_live",
    } as any);
    expect(env.PAYMENTS_PROVIDER).toBe("stripe");
  });

  it("errors when stripe keys missing", () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({
        PAYMENTS_PROVIDER: "stripe",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "whsec",
      } as any),
    ).toThrow("Invalid payments environment variables");
    err.mockRestore();
  });

  it("toggles sandbox flag", () => {
    const off = loadPaymentsEnv({ PAYMENTS_SANDBOX: "false" } as any);
    expect(off.PAYMENTS_SANDBOX).toBe(false);
    const on = loadPaymentsEnv({ PAYMENTS_SANDBOX: "true" } as any);
    expect(on.PAYMENTS_SANDBOX).toBe(true);
  });

  it("warns and falls back on invalid currency", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({ PAYMENTS_CURRENCY: "usd1" } as any);
    expect(env.PAYMENTS_CURRENCY).toBe("USD");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
