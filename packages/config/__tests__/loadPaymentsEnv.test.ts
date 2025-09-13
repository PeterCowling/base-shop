import { afterEach, describe, expect, it } from "@jest/globals";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loadPaymentsEnv", () => {
  it("returns defaults when gateway disabled", async () => {
    const { loadPaymentsEnv, paymentsEnvSchema } = await import(
      "../src/env/payments"
    );
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadPaymentsEnv({
      PAYMENTS_GATEWAY: "disabled",
      PAYMENTS_PROVIDER: "paypal",
      STRIPE_SECRET_KEY: "",
    } as NodeJS.ProcessEnv);
    expect(env).toEqual(paymentsEnvSchema.parse({}));
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errSpy).not.toHaveBeenCalled();
  });

  it("throws for unsupported provider", async () => {
    const { loadPaymentsEnv } = await import("../src/env/payments");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({ PAYMENTS_PROVIDER: "paypal" } as NodeJS.ProcessEnv)
    ).toThrow("Invalid payments environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      "paypal"
    );
  });

  it("throws when STRIPE_SECRET_KEY missing", async () => {
    const { loadPaymentsEnv } = await import("../src/env/payments");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_WEBHOOK_SECRET: "whsec",
      } as NodeJS.ProcessEnv)
    ).toThrow("Invalid payments environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe"
    );
  });

  it("throws when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing", async () => {
    const { loadPaymentsEnv } = await import("../src/env/payments");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        STRIPE_WEBHOOK_SECRET: "whsec",
      } as NodeJS.ProcessEnv)
    ).toThrow("Invalid payments environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY when PAYMENTS_PROVIDER=stripe"
    );
  });

  it("throws when STRIPE_WEBHOOK_SECRET missing", async () => {
    const { loadPaymentsEnv } = await import("../src/env/payments");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadPaymentsEnv({
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      } as NodeJS.ProcessEnv)
    ).toThrow("Invalid payments environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe"
    );
  });

  it("warns and defaults on invalid currency", async () => {
    const { loadPaymentsEnv, paymentsEnvSchema } = await import(
      "../src/env/payments"
    );
    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const env = loadPaymentsEnv({
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      STRIPE_WEBHOOK_SECRET: "whsec",
      PAYMENTS_CURRENCY: "usd",
    } as NodeJS.ProcessEnv);
    expect(spy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object)
    );
    expect(env).toEqual(paymentsEnvSchema.parse({}));
  });

  it.each([
    ["true", true],
    ["false", false],
    ["1", true],
    ["0", false],
    ["TRUE", true],
    ["FALSE", false],
  ])("parses PAYMENTS_SANDBOX %s", async (value, expected) => {
    const { loadPaymentsEnv } = await import("../src/env/payments");
    const env = loadPaymentsEnv({
      STRIPE_SECRET_KEY: "sk",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
      STRIPE_WEBHOOK_SECRET: "whsec",
      PAYMENTS_SANDBOX: value,
    } as NodeJS.ProcessEnv);
    expect(env.PAYMENTS_SANDBOX).toBe(expected);
  });

  it("defaults PAYMENTS_SANDBOX to true", async () => {
    const { loadPaymentsEnv } = await import("../src/env/payments");
    const env = loadPaymentsEnv({} as NodeJS.ProcessEnv);
    expect(env.PAYMENTS_SANDBOX).toBe(true);
  });
});
