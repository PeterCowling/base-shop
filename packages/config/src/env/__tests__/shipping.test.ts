import { afterEach, describe, expect, it } from "@jest/globals";
import { loadShippingEnv } from "../shipping.ts";

describe("shipping env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("parses valid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { shippingEnv } = await import("../shipping.ts");
    expect(shippingEnv).toEqual({
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
      DHL_KEY: "dhl",
    });
  });

  it("throws on invalid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      UPS_KEY: 123 as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });
});

describe("loadShippingEnv", () => {
  it("parses valid env objects", () => {
    const env = {
      TAXJAR_KEY: "tax",
      UPS_KEY: "ups",
    } as NodeJS.ProcessEnv;
    expect(loadShippingEnv(env)).toEqual({ TAXJAR_KEY: "tax", UPS_KEY: "ups" });
  });

  it("logs and throws on invalid env objects", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadShippingEnv({ UPS_KEY: 123 as unknown as string } as NodeJS.ProcessEnv),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });
});

