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

  it.each(["", undefined])(
    "returns undefined for ALLOWED_COUNTRIES=%p",
    async (val) => {
      await withEnv({ ALLOWED_COUNTRIES: val as any }, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        const env = loadShippingEnv();
        expect(env.ALLOWED_COUNTRIES).toBeUndefined();
      });
    }
  );

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
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() =>
          loadShippingEnv({ LOCAL_PICKUP_ENABLED: "maybe" as any })
        ).toThrow("Invalid shipping environment variables");
        expect(() =>
          loadShippingEnv({ LOCAL_PICKUP_ENABLED: "hello" as any })
        ).toThrow("Invalid shipping environment variables");
        expect(errorSpy).toHaveBeenCalledTimes(2);
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
        const { loadShippingEnv } = await import(MODULE_PATH);
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() =>
          loadShippingEnv({ DEFAULT_COUNTRY: "USA" as any })
        ).toThrow("Invalid shipping environment variables");
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
      });
    });
  });

  it("rejects invalid zone", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() =>
        loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "asia" as any })
      ).toThrow("Invalid shipping environment variables");
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  it("rejects negative or NaN threshold", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      expect(() =>
        loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "-10" })
      ).toThrow("Invalid shipping environment variables");
      expect(() =>
        loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "abc" })
      ).toThrow("Invalid shipping environment variables");
      expect(errorSpy).toHaveBeenCalledTimes(2);
      errorSpy.mockRestore();
    });
  });

  describe("provider-specific API keys", () => {
    it("requires UPS_KEY when provider is ups", async () => {
      await withEnv({}, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() =>
          loadShippingEnv({ SHIPPING_PROVIDER: "ups" } as any),
        ).toThrow("Invalid shipping environment variables");
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
      });
    });

    it("requires DHL_KEY when provider is dhl", async () => {
      await withEnv({}, async () => {
        const { loadShippingEnv } = await import(MODULE_PATH);
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        expect(() =>
          loadShippingEnv({ SHIPPING_PROVIDER: "dhl" } as any),
        ).toThrow("Invalid shipping environment variables");
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
      });
    });
  });

  it("allows missing optional keys", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      expect(loadShippingEnv()).toEqual({});
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

  it("logs and throws on invalid env during import", async () => {
    await withEnv(
      { DEFAULT_SHIPPING_ZONE: "galaxy" },
      async () => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(import(MODULE_PATH)).rejects.toThrow(
          "Invalid shipping environment variables"
        );
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mockRestore();
      }
    );
  });
});
