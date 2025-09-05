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
    expect(load({ SHIPPING_PROVIDER: "ups", UPS_KEY: "key" }).SHIPPING_PROVIDER).toBe(
      "ups",
    );
    expect(load({ SHIPPING_PROVIDER: "dhl", DHL_KEY: "key" }).SHIPPING_PROVIDER).toBe(
      "dhl",
    );
  });

  it("requires carrier keys for ups and dhl", async () => {
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

  it("rejects unknown providers", async () => {
    const load = await getLoader();
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      load({ SHIPPING_PROVIDER: "invalid" as any }),
    ).toThrow("Invalid shipping environment variables");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

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
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => load({ DEFAULT_COUNTRY: "USA" as any })).toThrow(
      "Invalid shipping environment variables",
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  describe("FREE_SHIPPING_THRESHOLD", () => {
    it("parses a valid number", async () => {
      const load = await getLoader();
      const env = load({ FREE_SHIPPING_THRESHOLD: "50" });
      expect(env.FREE_SHIPPING_THRESHOLD).toBe(50);
    });

    it("rejects negative numbers", async () => {
      const load = await getLoader();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() => load({ FREE_SHIPPING_THRESHOLD: "-5" })).toThrow(
        "Invalid shipping environment variables",
      );
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
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
      const env = load({ ALLOWED_COUNTRIES: "us, ca ,de" });
      expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
    });

    it("eagerly parses from process.env", async () => {
      jest.resetModules();
      process.env = {
        ALLOWED_COUNTRIES: "us, ca ,de",
      } as NodeJS.ProcessEnv;
      const { shippingEnv } = await import("../shipping.ts");
      expect(shippingEnv.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
    });
  });

  describe("local pickup toggle", () => {
    const cases: Array<[string, boolean]> = [
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
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
      const env = load({ DEFAULT_COUNTRY: "us" });
      expect(env.DEFAULT_COUNTRY).toBe("US");
    });

    it("throws on invalid code", async () => {
      const load = await getLoader();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() => load({ DEFAULT_COUNTRY: "USA" as any })).toThrow(
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

