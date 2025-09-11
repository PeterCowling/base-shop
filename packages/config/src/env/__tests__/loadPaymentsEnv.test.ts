import { describe, expect, it, jest } from "@jest/globals";
import { loadPaymentsEnv, paymentsEnvSchema } from "../payments";

describe("loadPaymentsEnv", () => {
  it("returns defaults when no provider", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({} as NodeJS.ProcessEnv);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("returns defaults when gateway disabled", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const env = loadPaymentsEnv({
      PAYMENTS_GATEWAY: "disabled",
    } as NodeJS.ProcessEnv);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("throws when PAYMENTS_PROVIDER is 'paypal'", () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({ PAYMENTS_PROVIDER: "paypal" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "paypal",
    );
    errSpy.mockRestore();
  });

  it.each([
    [
      "STRIPE_SECRET_KEY",
      {
        STRIPE_SECRET_KEY: undefined,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: "wh",
      },
      "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
    ],
    [
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined,
        STRIPE_WEBHOOK_SECRET: "wh",
      },
      "❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY when PAYMENTS_PROVIDER=stripe",
    ],
    [
      "STRIPE_WEBHOOK_SECRET",
      {
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
        STRIPE_WEBHOOK_SECRET: undefined,
      },
      "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
    ],
  ])("throws when %s is missing", (_name, vars, message) => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({
        PAYMENTS_PROVIDER: "stripe",
        ...vars,
      } as NodeJS.ProcessEnv),
    ).toThrow("Invalid payments environment variables");
    expect(errSpy).toHaveBeenCalledWith(message);
    errSpy.mockRestore();
  });

  it.each(["usd", "US"])('falls back to defaults on invalid currency %s', (currency) => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({ PAYMENTS_CURRENCY: currency } as NodeJS.ProcessEnv);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    warnSpy.mockRestore();
  });

  it("falls back to defaults on invalid sandbox value", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({ PAYMENTS_SANDBOX: "maybe" } as NodeJS.ProcessEnv);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    warnSpy.mockRestore();
  });

  it.each([
    ["1", true],
    ["0", false],
  ])("parses sandbox value %s", (value, expected) => {
    const env = loadPaymentsEnv({ PAYMENTS_SANDBOX: value } as NodeJS.ProcessEnv);
    expect(env.PAYMENTS_SANDBOX).toBe(expected);
  });

  it("returns defaults for currency and sandbox with valid stripe config", () => {
    const env = loadPaymentsEnv({
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
    } as NodeJS.ProcessEnv);
    expect(env).toEqual({
      PAYMENTS_PROVIDER: "stripe",
      STRIPE_SECRET_KEY: "sk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      PAYMENTS_CURRENCY: "USD",
      PAYMENTS_SANDBOX: true,
    });
  });
});

