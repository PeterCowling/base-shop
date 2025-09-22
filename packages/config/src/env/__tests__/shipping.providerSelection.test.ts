import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { resetShippingEnv } from "./shipping.test-helpers";

const getLoader = async () => {
  jest.resetModules();
  const { loadShippingEnv } = await import("../shipping.ts");
  return loadShippingEnv;
};

afterEach(() => {
  resetShippingEnv();
  jest.clearAllMocks();
});

describe("shipping provider selection", () => {
  it("handles valid provider selection", async () => {
    const load = await getLoader();
    expect(load({ SHIPPING_PROVIDER: "none" }).SHIPPING_PROVIDER).toBe("none");
    expect(load({ SHIPPING_PROVIDER: "external" }).SHIPPING_PROVIDER).toBe("external");
    expect(load({ SHIPPING_PROVIDER: "shippo" }).SHIPPING_PROVIDER).toBe("shippo");
    expect(load({ SHIPPING_PROVIDER: "ups", UPS_KEY: "key" }).SHIPPING_PROVIDER).toBe("ups");
    expect(load({ SHIPPING_PROVIDER: "dhl", DHL_KEY: "key" }).SHIPPING_PROVIDER).toBe("dhl");
  });

  it("returns minimal object when only provider + key provided", async () => {
    const load = await getLoader();
    expect(load({ SHIPPING_PROVIDER: "ups", UPS_KEY: "key" } as any)).toEqual({
      SHIPPING_PROVIDER: "ups",
      UPS_KEY: "key",
    });
    expect(load({ SHIPPING_PROVIDER: "dhl", DHL_KEY: "key" } as any)).toEqual({
      SHIPPING_PROVIDER: "dhl",
      DHL_KEY: "key",
    });
  });

  it("rejects unknown providers", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ SHIPPING_PROVIDER: "invalid" as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
