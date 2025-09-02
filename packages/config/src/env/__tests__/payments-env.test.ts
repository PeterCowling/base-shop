import { afterEach, describe, expect, it } from "@jest/globals";

// use const to hold original env
const ORIGINAL_ENV = process.env;
let warnSpy: jest.SpyInstance;

afterEach(() => {
  if (warnSpy) {
    warnSpy.mockRestore();
  }
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("payments env", () => {
  it("returns provided values without warnings", () => {
    const env = {
      STRIPE_SECRET_KEY: "sk_live_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    };
    process.env = env as NodeJS.ProcessEnv;
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv } = require("../payments.js");
    expect(paymentsEnv).toEqual(env);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("payments env defaults", () => {
  it.each([
    {
      name: "malformed values",
      env: {
        STRIPE_SECRET_KEY: 123 as unknown as string,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 456 as unknown as string,
        STRIPE_WEBHOOK_SECRET: 789 as unknown as string,
      },
    },
    {
      name: "empty strings",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
  ])(
    "warns and falls back to defaults when variables are $name",
    ({ env }) => {
      process.env = env as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = require("../payments.js");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );

  it.each([
    {
      name: "malformed values",
      env: {
        STRIPE_SECRET_KEY: 123 as unknown as string,
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 456 as unknown as string,
        STRIPE_WEBHOOK_SECRET: 789 as unknown as string,
      },
    },
    {
      name: "empty strings",
      env: {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      },
    },
  ])(
    "warns and falls back to defaults when variables are $name (ts import)",
    async ({ env }) => {
      process.env = env as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = await import("../payments.ts");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );

  it(
    "warns and falls back to defaults when STRIPE_SECRET_KEY is empty",
    async () => {
      process.env = {
        STRIPE_SECRET_KEY: "",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
      } as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = await import("../payments.ts");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );

  it(
    "warns and falls back to defaults when STRIPE_SECRET_KEY is missing",
    async () => {
      process.env = {
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
        STRIPE_WEBHOOK_SECRET: "",
      } as NodeJS.ProcessEnv;
      warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      jest.resetModules();
      const { paymentsEnv } = await import("../payments.ts");
      expect(paymentsEnv).toEqual({
        STRIPE_SECRET_KEY: "sk_test",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test",
        STRIPE_WEBHOOK_SECRET: "whsec_test",
      });
      expect(warnSpy).toHaveBeenCalledWith(
        "⚠️ Invalid payments environment variables:",
        expect.any(Object),
      );
    },
  );
});

