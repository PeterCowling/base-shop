import { describe, expect, it } from "@jest/globals";
import { withEnv } from "./envTestUtils";

// Tests for loadShippingEnv and shippingEnv eager parse

describe("shippingEnvSchema", () => {
  it("parses valid config", async () => {
    const { loadShippingEnv } = await import("@acme/config/env/shipping");
    const env = loadShippingEnv({
      DEFAULT_SHIPPING_ZONE: "eu",
      FREE_SHIPPING_THRESHOLD: "100",
    } as NodeJS.ProcessEnv);
    expect(env).toEqual({
      DEFAULT_SHIPPING_ZONE: "eu",
      FREE_SHIPPING_THRESHOLD: 100,
    });
  });

  it("throws on invalid zone", async () => {
    const { loadShippingEnv } = await import("@acme/config/env/shipping");
    expect(() =>
      loadShippingEnv({ DEFAULT_SHIPPING_ZONE: "galaxy" } as NodeJS.ProcessEnv),
    ).toThrow();
  });

  it("throws on negative threshold", async () => {
    const { loadShippingEnv } = await import("@acme/config/env/shipping");
    expect(() =>
      loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "-10" } as NodeJS.ProcessEnv),
    ).toThrow();
  });

  it("throws on non-numeric threshold", async () => {
    const { loadShippingEnv } = await import("@acme/config/env/shipping");
    expect(() =>
      loadShippingEnv({ FREE_SHIPPING_THRESHOLD: "abc" } as NodeJS.ProcessEnv),
    ).toThrow();
  });

  it("parses ALLOWED_COUNTRIES list", async () => {
    const { loadShippingEnv } = await import("@acme/config/env/shipping");
    const env = loadShippingEnv({
      ALLOWED_COUNTRIES: "us, ca , ,de,",
    } as any);
    expect(env.ALLOWED_COUNTRIES).toEqual(["US", "CA", "DE"]);
  });

  describe("LOCAL_PICKUP_ENABLED", () => {
    it.each([
      ["yes", true],
      ["no", false],
      ["1", true],
      ["0", false],
    ])("parses %s", async (input, expected) => {
      const { loadShippingEnv } = await import("@acme/config/env/shipping");
      const env = loadShippingEnv({
        LOCAL_PICKUP_ENABLED: input,
      } as any);
      expect(env.LOCAL_PICKUP_ENABLED).toBe(expected);
    });
  });

  describe("DEFAULT_COUNTRY", () => {
    it("uppercases value", async () => {
      const { loadShippingEnv } = await import("@acme/config/env/shipping");
      const env = loadShippingEnv({ DEFAULT_COUNTRY: " us " } as any);
      expect(env.DEFAULT_COUNTRY).toBe("US");
    });

    it("rejects invalid length", async () => {
      const { loadShippingEnv } = await import("@acme/config/env/shipping");
      expect(() =>
        loadShippingEnv({ DEFAULT_COUNTRY: "USA" } as any),
      ).toThrow();
    });
  });

  describe("provider requirements", () => {
    it("requires keys for ups and dhl", async () => {
      const { loadShippingEnv } = await import("@acme/config/env/shipping");
      expect(() =>
        loadShippingEnv({ SHIPPING_PROVIDER: "ups" } as any),
      ).toThrow();
      expect(() =>
        loadShippingEnv({ SHIPPING_PROVIDER: "dhl" } as any),
      ).toThrow();
    });
  });

  it("returns empty object when keys missing", async () => {
    const { loadShippingEnv } = await import("@acme/config/env/shipping");
    const env = loadShippingEnv({} as NodeJS.ProcessEnv);
    expect(env).toEqual({});
  });

  describe("eager parse", () => {
    it("populates shippingEnv on import", async () => {
      await withEnv({ DEFAULT_SHIPPING_ZONE: "domestic" }, async () => {
        const mod = await import("@acme/config/env/shipping");
        expect(mod.shippingEnv.DEFAULT_SHIPPING_ZONE).toBe("domestic");
      });
    });

    it("throws on invalid process.env during import", async () => {
      await expect(
        withEnv(
          { DEFAULT_SHIPPING_ZONE: "galaxy" },
          () => import("@acme/config/env/shipping"),
        ),
      ).rejects.toThrow("Invalid shipping environment variables");
    });

    it("throws when provider key missing during import", async () => {
      await expect(
        withEnv(
          { SHIPPING_PROVIDER: "ups" },
          () => import("@acme/config/env/shipping"),
        ),
      ).rejects.toThrow("Invalid shipping environment variables");
    });
  });
});

