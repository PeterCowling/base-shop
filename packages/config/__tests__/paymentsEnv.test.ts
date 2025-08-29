import { expect } from "@jest/globals";

describe("paymentsEnv", () => {
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

    const { paymentsEnv, paymentsEnvSchema } = await import("../src/env/payments");

    expect(spy).toHaveBeenCalledWith(
      "⚠️ Invalid payments environment variables:",
      expect.anything(),
    );
    expect(paymentsEnv).toEqual(paymentsEnvSchema.parse({}));
  });
});
