import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;

const getLoader = async () => {
  jest.resetModules();
  process.env = {} as NodeJS.ProcessEnv;
  const { loadShippingEnv } = await import("../shipping.ts");
  return loadShippingEnv;
};

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

describe("shipping environment parser", () => {
  it("handles provider selection", async () => {
    const load = await getLoader();
    expect(load({ SHIPPING_PROVIDER: "none" }).SHIPPING_PROVIDER).toBe("none");
    expect(load({ SHIPPING_PROVIDER: "external" }).SHIPPING_PROVIDER).toBe(
      "external",
    );
    expect(load({ SHIPPING_PROVIDER: "shippo" }).SHIPPING_PROVIDER).toBe(
      "shippo",
    );
  });

  describe("FREE_SHIPPING_THRESHOLD", () => {
    it("parses a valid number", async () => {
      const load = await getLoader();
      const env = load({ FREE_SHIPPING_THRESHOLD: "100" });
      expect(env.FREE_SHIPPING_THRESHOLD).toBe(100);
    });

    it("throws on invalid string", async () => {
      const load = await getLoader();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() =>
        load({ FREE_SHIPPING_THRESHOLD: "oops" as any }),
      ).toThrow("Invalid shipping environment variables");
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("ALLOWED_COUNTRIES", () => {
    it("parses and normalizes list", async () => {
      const load = await getLoader();
      const env = load({ ALLOWED_COUNTRIES: "US, IT ,de" });
      expect(env.ALLOWED_COUNTRIES).toEqual(["US", "IT", "DE"]);
    });

    it("eagerly parses from process.env", async () => {
      jest.resetModules();
      process.env = {
        ALLOWED_COUNTRIES: "us, it ,de",
      } as NodeJS.ProcessEnv;
      const { shippingEnv } = await import("../shipping.ts");
      expect(shippingEnv.ALLOWED_COUNTRIES).toEqual(["US", "IT", "DE"]);
    });
  });

  describe("local pickup toggle", () => {
    const cases: Array<[string, boolean]> = [
      ["true", true],
      [" false ", false],
      ["1", true],
      ["0", false],
      ["TRUE", true],
      ["FaLsE", false],
    ];

    it.each(cases)("parses %s", async (input, expected) => {
      const load = await getLoader();
      const env = load({ LOCAL_PICKUP_ENABLED: input });
      expect(env.LOCAL_PICKUP_ENABLED).toBe(expected);
    });

    it("throws on invalid values", async () => {
      const load = await getLoader();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() =>
        load({ LOCAL_PICKUP_ENABLED: "maybe" as any })
      ).toThrow("Invalid shipping environment variables");
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("DEFAULT_COUNTRY", () => {
    it("is undefined when unset", async () => {
      const load = await getLoader();
      const env = load({});
      expect(env.DEFAULT_COUNTRY).toBeUndefined();
    });

    it("normalizes when set", async () => {
      const load = await getLoader();
      const env = load({ DEFAULT_COUNTRY: "de" });
      expect(env.DEFAULT_COUNTRY).toBe("DE");
    });

    it("throws on invalid code", async () => {
      const load = await getLoader();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() => load({ DEFAULT_COUNTRY: "deu" as any })).toThrow(
        "Invalid shipping environment variables",
      );
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("loader vs eager parse", () => {
    it("does not reparse shippingEnv after import", async () => {
      jest.resetModules();
      process.env = { DEFAULT_COUNTRY: "us" } as NodeJS.ProcessEnv;
      const mod = await import("../shipping.ts");
      expect(mod.shippingEnv.DEFAULT_COUNTRY).toBe("US");

      process.env.DEFAULT_COUNTRY = "ca";
      expect(mod.shippingEnv.DEFAULT_COUNTRY).toBe("US");
      expect(mod.loadShippingEnv(process.env).DEFAULT_COUNTRY).toBe("CA");
    });
  });
});

