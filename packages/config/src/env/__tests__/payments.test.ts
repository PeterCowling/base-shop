import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;
let warnSpy: jest.SpyInstance;

afterEach(() => {
  warnSpy?.mockRestore();
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("payments env schema", () => {
  it("warns and falls back to defaults when STRIPE_SECRET_KEY is empty", () => {
    process.env = {
      STRIPE_SECRET_KEY: "",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
      STRIPE_WEBHOOK_SECRET: "whsec_live_123",
    } as NodeJS.ProcessEnv;

    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.resetModules();
    const { paymentsEnv, paymentsEnvSchema } = require("../payments.js");

    const parsed = paymentsEnvSchema.safeParse(process.env);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.format()).toHaveProperty("STRIPE_SECRET_KEY");
    }
    expect(warnSpy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.any(Object),
    );
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
  });
});
