import { describe, expect, it, jest } from "@jest/globals";

import { withEnv } from "./envTestUtils";

const MODULE_PATH = "@acme/config/env/shipping";

describe("loadShippingEnv", () => {
  it("parses valid configuration", async () => {
    await withEnv(
      {
        DEFAULT_SHIPPING_ZONE: "eu",
        FREE_SHIPPING_THRESHOLD: "100",
      },
      async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        const env = loadShippingEnv();
        expect(env.DEFAULT_SHIPPING_ZONE).toBe("eu");
        expect(env.FREE_SHIPPING_THRESHOLD).toBe(100);
      }
    );
  });

  it("parses and normalizes allowed countries", async () => {
    await withEnv(
      { ALLOWED_COUNTRIES: "us, ca , de" },
      async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        const env = loadShippingEnv();
        expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
      }
    );
  });

  it("returns undefined for ALLOWED_COUNTRIES=undefined", async () => {
    await withEnv({ ALLOWED_COUNTRIES: undefined as any }, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      const env = loadShippingEnv();
      expect(env.ALLOWED_COUNTRIES).toBeUndefined();
    });
  });

  it("returns undefined for ALLOWED_COUNTRIES='' (empty string)", async () => {
    await withEnv({ ALLOWED_COUNTRIES: "" }, async () => {
      const { shippingEnvSchema } = await import(MODULE_PATH);
      // Test schema directly - empty string should preprocess to undefined
      const result = shippingEnvSchema.safeParse({ ALLOWED_COUNTRIES: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ALLOWED_COUNTRIES).toBeUndefined();
      }
    });
  });

  describe("local pickup toggle", () => {
    const cases: Array<[string, boolean]> = [
      ["true", true],
      ["1", true],
      ["0", false],
      ["false", false],
    ];

    it.each(cases)("parses %s", async (input, expected) => {
      await withEnv({ LOCAL_PICKUP_ENABLED: input }, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        const env = loadShippingEnv();
        expect(env.LOCAL_PICKUP_ENABLED).toBe(expected);
      });
    });

    it("rejects invalid values", async () => {
      await withEnv({}, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        // Suppress expected console.error from validation
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() =>
          loadShippingEnv({ LOCAL_PICKUP_ENABLED: "maybe" as any })
        ).toThrow("Invalid shipping environment variables");
        expect(() =>
          loadShippingEnv({ LOCAL_PICKUP_ENABLED: "hello" as any })
        ).toThrow("Invalid shipping environment variables");
        errorSpy.mockRestore();
      });
    });
  });

  describe("default country", () => {
    it("normalizes lowercase codes", async () => {
      await withEnv({ DEFAULT_COUNTRY: "us" }, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        const env = loadShippingEnv();
        expect(env.DEFAULT_COUNTRY).toBe("US");
      });
    });

    it("throws on invalid codes", async () => {
      await withEnv({}, async () => {
        const { shippingEnvSchema } = await import(MODULE_PATH);
        // Test schema validation directly - "USA" is 3 letters, should fail 2-letter check
        const result = shippingEnvSchema.safeParse({ DEFAULT_COUNTRY: "USA" });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.format().DEFAULT_COUNTRY?._errors).toContain(
            "must be a 2-letter country code"
          );
        }
      });
    });
  });

  it("rejects invalid zone", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      // Suppress expected console.error from validation
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() =>
        loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "asia" as any })
      ).toThrow("Invalid shipping environment variables");
      errorSpy.mockRestore();
    });
  });

  it("rejects negative or NaN threshold", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      // Suppress expected console.error from validation
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() =>
        loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "-10" })
      ).toThrow("Invalid shipping environment variables");
      expect(() =>
        loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "abc" })
      ).toThrow("Invalid shipping environment variables");
      errorSpy.mockRestore();
    });
  });

  describe("provider-specific API keys", () => {
    it("requires UPS_KEY when provider is ups", async () => {
      await withEnv({}, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        // Suppress expected console.error from validation
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() =>
          loadShippingEnv({ SHIPPING_PROVIDER: "ups" } as any),
        ).toThrow("Invalid shipping environment variables");
        errorSpy.mockRestore();
      });
    });

    it("requires DHL_KEY when provider is dhl", async () => {
      await withEnv({}, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        // Suppress expected console.error from validation
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() =>
          loadShippingEnv({ SHIPPING_PROVIDER: "dhl" } as any),
        ).toThrow("Invalid shipping environment variables");
        errorSpy.mockRestore();
      });
    });
  });

  it("allows missing optional keys", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      const result = loadShippingEnv();
      // When no env vars are set, the loader returns an object with undefined values
      // and a default SHIPPING_PROVIDER of "none"
      expect(result.SHIPPING_PROVIDER).toBe("none");
      expect(result.TAXJAR_KEY).toBeUndefined();
    });
  });
});

describe("eager shippingEnv import", () => {
  it("exports parsed result", async () => {
    await withEnv(
      { DEFAULT_SHIPPING_ZONE: "domestic" },
      async () => {
        const mod = await import(MODULE_PATH);
        const expected = mod.loadShippingEnv();
        expect(mod.shippingEnv).toEqual(expected);
      }
    );
  });

  it("throws on invalid env during import", async () => {
    await withEnv(
      { DEFAULT_SHIPPING_ZONE: "galaxy" },
      async () => {
        // Suppress expected console.error from validation
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(import(MODULE_PATH)).rejects.toThrow(
          "Invalid shipping environment variables"
        );
        errorSpy.mockRestore();
      }
    );
  });
});
