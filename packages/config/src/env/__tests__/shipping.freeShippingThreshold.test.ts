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

describe("FREE_SHIPPING_THRESHOLD parsing", () => {
  it("parses a valid number", async () => {
    const load = await getLoader();
    const env = load({ FREE_SHIPPING_THRESHOLD: "50" });
    expect(env.FREE_SHIPPING_THRESHOLD).toBe(50);
  });

  it("accepts zero", async () => {
    const load = await getLoader();
    const env = load({ FREE_SHIPPING_THRESHOLD: "0" });
    expect(env.FREE_SHIPPING_THRESHOLD).toBe(0);
  });

  it("rejects negative numbers", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ FREE_SHIPPING_THRESHOLD: "-5" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("rejects negative decimals", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ FREE_SHIPPING_THRESHOLD: "-0.01" })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws on invalid string", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => load({ FREE_SHIPPING_THRESHOLD: "oops" as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
