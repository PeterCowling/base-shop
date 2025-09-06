/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;

const getLoader = async () => {
  jest.resetModules();
  const { loadShippingEnv } = await import("../shipping.ts");
  return loadShippingEnv;
};

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("loadShippingEnv", () => {
  it("parses ALLOWED_COUNTRIES list", async () => {
    const load = await getLoader();
    const env = load({ ALLOWED_COUNTRIES: "us, ca , de," } as any);
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
  });

  it("returns undefined for empty ALLOWED_COUNTRIES", async () => {
    const load = await getLoader();
    const env = load({ ALLOWED_COUNTRIES: "" } as any);
    expect(env.ALLOWED_COUNTRIES).toBeUndefined();
  });

  describe("LOCAL_PICKUP_ENABLED", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["yes", true],
      ["0", false],
    ])("parses %s", async (input, expected) => {
      const load = await getLoader();
      const env = load({ LOCAL_PICKUP_ENABLED: input } as any);
      expect(env.LOCAL_PICKUP_ENABLED).toBe(expected);
    });

    it("throws on invalid value", async () => {
      const load = await getLoader();
      expect(() =>
        load({ LOCAL_PICKUP_ENABLED: "maybe" } as any),
      ).toThrow("Invalid shipping environment variables");
    });
  });

  describe("DEFAULT_COUNTRY", () => {
    it("uppercases and trims", async () => {
      const load = await getLoader();
      const env = load({ DEFAULT_COUNTRY: " us " } as any);
      expect(env.DEFAULT_COUNTRY).toBe("US");
    });

    it("rejects invalid codes", async () => {
      const load = await getLoader();
      expect(() =>
        load({ DEFAULT_COUNTRY: "USA" } as any),
      ).toThrow("Invalid shipping environment variables");
    });
  });

  describe("provider requirements", () => {
    it("errors when keys missing", async () => {
      const load = await getLoader();
      expect(() =>
        load({ SHIPPING_PROVIDER: "ups" } as any),
      ).toThrow("Invalid shipping environment variables");
      expect(() =>
        load({ SHIPPING_PROVIDER: "dhl" } as any),
      ).toThrow("Invalid shipping environment variables");
    });

    it("succeeds when keys present", async () => {
      const load = await getLoader();
      expect(
        load({ SHIPPING_PROVIDER: "ups", UPS_KEY: "key" } as any),
      ).toEqual({ SHIPPING_PROVIDER: "ups", UPS_KEY: "key" });
      expect(
        load({ SHIPPING_PROVIDER: "dhl", DHL_KEY: "key" } as any),
      ).toEqual({ SHIPPING_PROVIDER: "dhl", DHL_KEY: "key" });
    });
  });

  it("throws on invalid env", async () => {
    const load = await getLoader();
    expect(() => load({ ALLOWED_COUNTRIES: 123 as any })).toThrow(
      "Invalid shipping environment variables",
    );
  });
});
