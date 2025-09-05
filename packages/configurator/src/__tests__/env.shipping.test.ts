import { afterEach, describe, expect, it, jest } from "@jest/globals";

const ORIGINAL_ENV = process.env;

const getLoader = async () => {
  jest.resetModules();
  process.env = {} as NodeJS.ProcessEnv;
  const { loadShippingEnv } = await import("@acme/config/env/shipping");
  return loadShippingEnv;
};

afterEach(() => {
  process.env = ORIGINAL_ENV;
  jest.resetModules();
});

describe("shipping environment parser", () => {
  it("parses a valid configuration", async () => {
    const load = await getLoader();
    const env = load({
      DEFAULT_SHIPPING_ZONE: "eu",
      FREE_SHIPPING_THRESHOLD: "100",
    });
    expect(env.DEFAULT_SHIPPING_ZONE).toBe("eu");
    expect(env.FREE_SHIPPING_THRESHOLD).toBe(100);
  });

  it("throws on invalid zone", async () => {
    const load = await getLoader();
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      load({ DEFAULT_SHIPPING_ZONE: "galaxy" as any }),
    ).toThrow("Invalid shipping environment variables");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  describe("FREE_SHIPPING_THRESHOLD", () => {
    it.each(["-10", "abc"])("rejects %s", async (val) => {
      const load = await getLoader();
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      expect(() =>
        load({ FREE_SHIPPING_THRESHOLD: val as any }),
      ).toThrow("Invalid shipping environment variables");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  it("treats all keys as optional", async () => {
    const load = await getLoader();
    const env = load();
    expect(env).toEqual({});
  });

  describe("eager import", () => {
    it("parses on import", async () => {
      jest.resetModules();
      process.env = { DEFAULT_SHIPPING_ZONE: "domestic" } as any;
      const mod = await import("@acme/config/env/shipping");
      expect(mod.shippingEnv).toEqual(mod.loadShippingEnv());
    });

    it("throws when env invalid", async () => {
      jest.resetModules();
      process.env = { DEFAULT_SHIPPING_ZONE: "galaxy" } as any;
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        import("@acme/config/env/shipping"),
      ).rejects.toThrow("Invalid shipping environment variables");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

