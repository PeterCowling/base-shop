import { describe, expect, it } from "@jest/globals";
import { withEnv } from "./envTestUtils";

const MODULE_PATH = "@acme/config/src/env/shipping.ts";

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

  it("rejects invalid zone", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      expect(() =>
        loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "galaxy" })
      ).toThrow("Invalid shipping environment variables");
    });
  });

  it("rejects negative or NaN threshold", async () => {
    await withEnv({}, async () => {
      const { loadShippingEnv } = await import(MODULE_PATH);
      expect(() =>
        loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "-10" })
      ).toThrow("Invalid shipping environment variables");
      expect(() =>
        loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "abc" })
      ).toThrow("Invalid shipping environment variables");
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

  it("throws on invalid env during import", async () => {
    await withEnv(
      { DEFAULT_SHIPPING_ZONE: "galaxy" },
      async () => {
        await expect(import(MODULE_PATH)).rejects.toThrow(
          "Invalid shipping environment variables"
        );
      }
    );
  });
});
