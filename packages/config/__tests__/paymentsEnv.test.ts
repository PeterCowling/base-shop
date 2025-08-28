import { expect } from "@jest/globals";

describe("paymentEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("falls back to defaults and warns on invalid env", async () => {
    process.env = {
      STRIPE_SECRET_KEY: "",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { paymentEnv, paymentEnvSchema } = await import("../src/env/payments.impl");

    expect(spy).toHaveBeenCalledWith(
      "⚠️ Invalid payment environment variables:",
      expect.anything(),
    );
    expect(paymentEnv).toEqual(paymentEnvSchema.parse({}));
  });
});
