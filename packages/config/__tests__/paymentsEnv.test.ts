import { expect } from "@jest/globals";

describe("paymentsEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("parses valid Stripe keys without warnings", async () => {
    process.env = {
      STRIPE_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_456",
      STRIPE_WEBHOOK_SECRET: "whsec_789",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { paymentsEnv } = await import("../src/env/payments");

    expect(spy).not.toHaveBeenCalled();
    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_456",
      STRIPE_WEBHOOK_SECRET: "whsec_789",
    });
  });

  it("falls back to defaults and warns on invalid env", async () => {
    process.env = {
      STRIPE_SECRET_KEY: "",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { paymentsEnv, paymentsEnvSchema } = await import("../src/env/payments");

    expect(spy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.anything(),
    );
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
  });
});
