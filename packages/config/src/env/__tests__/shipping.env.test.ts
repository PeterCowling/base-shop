import { afterEach, describe, expect, it } from "@jest/globals";
import { shippingEnvSchema } from "../shipping.ts";

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

  describe("provider key validation", () => {
    it("adds an issue when UPS_KEY is missing", () => {
      const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "ups" });
      expect(result.success).toBe(false);
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["UPS_KEY"],
            message: "UPS_KEY is required when SHIPPING_PROVIDER=ups",
          }),
        ]),
      );
    });

    it("adds an issue when DHL_KEY is missing", () => {
      const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "dhl" });
      expect(result.success).toBe(false);
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DHL_KEY"],
            message: "DHL_KEY is required when SHIPPING_PROVIDER=dhl",
          }),
        ]),
      );
    });

    it("fails when UPS_KEY missing for ups", () => {
      const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "ups" });
      expect(result.success).toBe(false);
      expect(result.error.format()).toEqual(
        expect.objectContaining({
          UPS_KEY: {
            _errors: ["UPS_KEY is required when SHIPPING_PROVIDER=ups"],
          },
        }),
      );
    });

    it("fails when DHL_KEY missing for dhl", () => {
      const result = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "dhl" });
      expect(result.success).toBe(false);
      expect(result.error.format()).toEqual(
        expect.objectContaining({
          DHL_KEY: {
            _errors: ["DHL_KEY is required when SHIPPING_PROVIDER=dhl"],
          },
        }),
      );
    });

    it("succeeds when required keys are present", () => {
      expect(
        shippingEnvSchema.safeParse({
          SHIPPING_PROVIDER: "ups",
          UPS_KEY: "k",
        }).success,
      ).toBe(true);
      expect(
        shippingEnvSchema.safeParse({
          SHIPPING_PROVIDER: "dhl",
          DHL_KEY: "k",
        }).success,
      ).toBe(true);
    });
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

    it("accepts zero", async () => {
      const load = await getLoader();
      const env = load({ FREE_SHIPPING_THRESHOLD: "0" });
      expect(env.FREE_SHIPPING_THRESHOLD).toBe(0);
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

    it("rejects negative decimals", async () => {
      const load = await getLoader();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() => load({ FREE_SHIPPING_THRESHOLD: "-0.01" })).toThrow(
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

    it("handles trailing commas", async () => {
      const load = await getLoader();
      const env = load({ ALLOWED_COUNTRIES: "us, ca, " });
      expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA"]);
    });

    it("returns undefined for empty string", async () => {
      const load = await getLoader();
      const env = load({ ALLOWED_COUNTRIES: "" });
      expect(env.ALLOWED_COUNTRIES).toBeUndefined();
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
      ["TRUE", true],
      ["FALSE", false],
      ["1", true],
      ["0", false],
    ];

    it.each(cases)("parses %s", async (input, expected) => {
      const load = await getLoader();
      const env = load({ LOCAL_PICKUP_ENABLED: input });
      expect(env.LOCAL_PICKUP_ENABLED).toBe(expected);
    });

    it("is undefined when not set", async () => {
      const load = await getLoader();
      const env = load({});
      expect(env.LOCAL_PICKUP_ENABLED).toBeUndefined();
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

    it("trims and uppercases", async () => {
      const load = await getLoader();
      const env = load({ DEFAULT_COUNTRY: " gb " });
      expect(env.DEFAULT_COUNTRY).toBe("GB");
    });

    it.each(["USA", "123", "gbr"])(
      "throws on invalid code %s",
      async (val) => {
        const load = await getLoader();
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() => load({ DEFAULT_COUNTRY: val as any })).toThrow(
          "Invalid shipping environment variables",
        );
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
      },
    );
  });

  describe("DEFAULT_SHIPPING_ZONE", () => {
    it("accepts valid zones", async () => {
      const load = await getLoader();
      const env = load({ DEFAULT_SHIPPING_ZONE: "eu" });
      expect(env.DEFAULT_SHIPPING_ZONE).toBe("eu");
    });

    it("rejects invalid zones", async () => {
      const load = await getLoader();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() =>
        load({ DEFAULT_SHIPPING_ZONE: "mars" as any }),
      ).toThrow("Invalid shipping environment variables");
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

