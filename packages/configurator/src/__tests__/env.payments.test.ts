import { describe, expect, it, jest } from "@jest/globals";

import { withEnv } from "./envTestUtils";

describe("payments env schema", () => {
  it("defaults to disabled configuration when gateway disabled", async () => {
    const { paymentsEnv, paymentsEnvSchema } = await withEnv(
      { PAYMENTS_GATEWAY: "disabled" },
      () => import("@acme/config/env/payments"),
    );
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
  });

  it("returns provided values for valid stripe config", async () => {
    const input = {
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_CURRENCY: "EUR",
      PAYMENTS_SANDBOX: "false",
    } as const;
    const { paymentsEnv } = await withEnv(input, () =>
      import("@acme/config/env/payments"),
    );
    expect(paymentsEnv).toEqual({
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_CURRENCY: "EUR",
      PAYMENTS_SANDBOX: false,
    });
  });

  it("throws when PAYMENTS_PROVIDER is unsupported", async () => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { PAYMENTS_PROVIDER: "paypal" },
        () => import("@acme/config/env/payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(err).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "paypal",
    );
    err.mockRestore();
  });

  it.each([
    [
      "STRIPE_SECRET_KEY",
      { STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: "whsec_live_123" },
      "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
    ],
    [
      "STRIPE_WEBHOOK_SECRET",
      { STRIPE_SECRET_KEY: "sk_live_123", STRIPE_WEBHOOK_SECRET: undefined },
      "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
    ],
  ])("throws when %s is missing", async (_name, vars, message) => {
    const err = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          PAYMENTS_PROVIDER: "stripe",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
          ...vars,
        },
        () => import("@acme/config/env/payments"),
      ),
    ).rejects.toThrow("Invalid payments environment variables");
    expect(err).toHaveBeenCalledWith(message);
    err.mockRestore();
  });

  it.each([
    [{ PAYMENTS_SANDBOX: "yesno" }, "PAYMENTS_SANDBOX"],
    [{ PAYMENTS_CURRENCY: "usd" }, "PAYMENTS_CURRENCY"],
  ])("falls back to defaults on invalid %s", async (vars) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { paymentsEnv, paymentsEnvSchema } = await withEnv(
      vars,
      () => import("@acme/config/env/payments"),
    );
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
    expect(warn).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    warn.mockRestore();
  });
});

