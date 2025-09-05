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
  });
});

