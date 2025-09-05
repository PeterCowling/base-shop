/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;
let errorSpy: jest.SpyInstance;

afterEach(() => {
  errorSpy?.mockRestore();
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("payments env", () => {
  it("returns provided values with defaults without errors", () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    };
    process.env = env as NodeJS.ProcessEnv;
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      ...env,
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("supports ts imports", async () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    };
    process.env = env as NodeJS.ProcessEnv;
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = await import("../payments.ts");
    expect(paymentsEnv).toEqual({
      ...env,
      PAYMENTS_SANDBOX: true,
      PAYMENTS_CURRENCY: "USD",
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("transforms boolean and currency values", () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_SANDBOX: "false",
      PAYMENTS_CURRENCY: "eur",
    };
    process.env = env as NodeJS.ProcessEnv;
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      PAYMENTS_SANDBOX: false,
      PAYMENTS_CURRENCY: "EUR",
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("throws and logs formatted errors for invalid variables", () => {
    process.env = {
      STRIPE_SECRET_KEY: "",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
      STRIPE_WEBHOOK_SECRET: "",
      PAYMENTS_SANDBOX: "notbool",
      PAYMENTS_CURRENCY: "usdollars",
    } as unknown as NodeJS.ProcessEnv;
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    expect(() => require("../payments.js")).toThrow(
      "Invalid payments environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid payments environment variables:",
      expect.any(Object),
    );
  });
});

