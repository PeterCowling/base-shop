import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { resetShippingEnv, setShippingEnv } from "./shipping.test-helpers";

const getLoader = async () => {
  jest.resetModules();
  const { loadShippingEnv } = await import("../shipping.ts");
  return loadShippingEnv;
};

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("shipping provider key requirements", () => {
  it("requires UPS_KEY and DHL_KEY when providers selected", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ SHIPPING_PROVIDER: "ups" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(() => load({ SHIPPING_PROVIDER: "dhl" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("reports missing UPS_KEY when provider is ups", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ SHIPPING_PROVIDER: "ups" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        UPS_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("reports missing DHL_KEY when provider is dhl", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ SHIPPING_PROVIDER: "dhl" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("logs the specific DHL_KEY message on loader path", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ SHIPPING_PROVIDER: "dhl" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: {
          _errors: ["DHL_KEY is required when SHIPPING_PROVIDER=dhl"],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws eagerly on import when DHL_KEY missing for dhl", async () => {
    setShippingEnv({ SHIPPING_PROVIDER: "dhl" } as NodeJS.ProcessEnv);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../shipping.ts")).rejects.toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid shipping environment variables:",
      expect.objectContaining({
        DHL_KEY: {
          _errors: ["DHL_KEY is required when SHIPPING_PROVIDER=dhl"],
        },
      }),
    );
    errorSpy.mockRestore();
  });
});
