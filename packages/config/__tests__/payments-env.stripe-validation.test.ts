import { describe, expect, it, jest } from "@jest/globals";
import { loadPaymentsEnv } from "../src/env/payments";

describe("payments env – stripe provider", () => {
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

