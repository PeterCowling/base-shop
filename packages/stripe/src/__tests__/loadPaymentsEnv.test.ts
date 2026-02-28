/** @jest-environment node */
// packages/stripe/src/__tests__/loadPaymentsEnv.test.ts

import { loadPaymentsEnv, paymentsEnvSchema } from "@acme/config/env/payments";

describe("loadPaymentsEnv", () => {
  it("returns defaults when gateway disabled", () => {
    const env = loadPaymentsEnv({
      PAYMENTS_GATEWAY: "disabled",
    } as unknown as NodeJS.ProcessEnv);

    expect(env).toMatchObject({
      STRIPE_SECRET_KEY: "sk_test",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(env).toEqual(paymentsEnvSchema.parse({}));
  });

  it.each([
    [
      "STRIPE_SECRET_KEY",
      { STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: "whsec_123" },
      "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
    ],
    [
      "STRIPE_WEBHOOK_SECRET",
      { STRIPE_SECRET_KEY: "sk_123", STRIPE_WEBHOOK_SECRET: undefined },
      "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
    ],
  ])("throws when %s is missing", (_name: string, vars: Record<string, string | undefined>, message: string) => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({
        PAYMENTS_PROVIDER: "stripe",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_123",
        ...vars,
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(message);
    errSpy.mockRestore();
  });

  it("falls back to defaults on invalid sandbox value", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({
      PAYMENTS_SANDBOX: "maybe",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    warnSpy.mockRestore();
  });

  it.each(["usd", "USDT"])(
    "falls back to defaults on invalid currency %s",
    (currency: string) => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const env = loadPaymentsEnv({
        PAYMENTS_CURRENCY: currency,
      } as unknown as NodeJS.ProcessEnv);
      expect(env).toEqual(paymentsEnvSchema.parse({}));
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
      warnSpy.mockRestore();
    },
  );

  it("returns provided values for valid stripe config", () => {
    const env = loadPaymentsEnv({
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      PAYMENTS_CURRENCY: "EUR",
      PAYMENTS_SANDBOX: "0",
    } as unknown as NodeJS.ProcessEnv);

    expect(env).toEqual({
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      PAYMENTS_CURRENCY: "EUR",
      PAYMENTS_SANDBOX: false,
      AXERVE_SANDBOX: false,
    });
  });
});

