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

describe("DEFAULT_SHIPPING_ZONE validation", () => {
  it("accepts valid zones", async () => {
    const load = await getLoader();
    const env = load({ DEFAULT_SHIPPING_ZONE: "eu" });
    expect(env.DEFAULT_SHIPPING_ZONE).toBe("eu");
  });

  it("rejects invalid zones", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ DEFAULT_SHIPPING_ZONE: "mars" as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
