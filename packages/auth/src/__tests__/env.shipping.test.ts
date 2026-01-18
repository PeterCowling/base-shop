import { afterEach, describe, expect, it, jest } from "@jest/globals";

type EnvOverrides = Record<string, string | undefined>;

const ORIGINAL_ENV = process.env;

const getLoader = async () => {
  jest.resetModules();
  process.env = {} as NodeJS.ProcessEnv;
  const { loadShippingEnv } = await import("@acme/config/env/shipping");
  return (overrides: EnvOverrides = {}) =>
    loadShippingEnv(overrides as unknown as NodeJS.ProcessEnv);
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

  it("parses allowed country list", async () => {
    const load = await getLoader();
    const env = load({ ALLOWED_COUNTRIES: "US, IT ,de" });
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "IT", "DE"]);
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
});

