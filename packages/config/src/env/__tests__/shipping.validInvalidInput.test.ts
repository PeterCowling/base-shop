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

describe("shipping env valid/invalid input", () => {
  it("returns parsed data on valid input", async () => {
    const load = await getLoader();
    const env = load({
      ALLOWED_COUNTRIES: "us, ca ,de",
      LOCAL_PICKUP_ENABLED: "true",
      DEFAULT_COUNTRY: "us",
      FREE_SHIPPING_THRESHOLD: "50",
    });
    expect(env).toEqual({
      ALLOWED_COUNTRIES: ["US", "CA", "DE"],
      LOCAL_PICKUP_ENABLED: true,
      DEFAULT_COUNTRY: "US",
      FREE_SHIPPING_THRESHOLD: 50,
    });
  });

  it("throws on invalid input", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ DEFAULT_COUNTRY: "USA" as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
