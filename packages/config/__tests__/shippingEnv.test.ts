import { expect } from "@jest/globals";

describe("shippingEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("parses when optional keys are valid strings", async () => {
    process.env = {
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv;

    const { shippingEnv } = await import("../src/env/shipping.impl");
    expect(shippingEnv).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
  });

  it("throws and logs when a key has an invalid type", async () => {
    process.env = {
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      // @ts-expect-error - intentionally invalid type to trigger schema failure
      DHL_KEY: 123,
    } as unknown as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../src/env/shipping.impl")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });
});
