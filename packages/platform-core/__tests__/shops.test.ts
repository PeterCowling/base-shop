// packages/platform-core/__tests__/shops.test.ts
import { getSanityConfig, setSanityConfig, validateShopName } from "../src/shops";
import type { Shop } from "@types";

describe("validateShopName", () => {
  it("trims and accepts safe names", () => {
    expect(validateShopName("  store_1 ")).toBe("store_1");
  });

  it("throws for invalid characters", () => {
    expect(() => validateShopName("bad/name")).toThrow("Invalid shop name");
  });
});

describe("theme token overrides", () => {
  it("merges overrides with base tokens", () => {
    const base = { "--color-bg": "white", "--color-primary": "blue" };
    const overrides = { "--color-bg": "pink" };
    const merged = { ...base, ...overrides };
    expect(merged["--color-bg"]).toBe("pink");
    expect(merged["--color-primary"]).toBe("blue");
  });

  it("retains overrides after theme change", () => {
    const overrides = { "--color-bg": "pink" };
    const newDefaults = { "--color-bg": "white", "--color-primary": "green" };
    const merged = { ...newDefaults, ...overrides };
    expect(merged["--color-bg"]).toBe("pink");
    expect(merged["--color-primary"]).toBe("green");
  });
});

describe("sanity blog accessors", () => {
  const baseShop: Shop = {
    id: "shop",
    name: "shop",
    catalogFilters: [],
    themeId: "base",
    themeTokens: {},
    filterMappings: {},
    priceOverrides: {},
    localeOverrides: {},
    navigation: [],
    analyticsEnabled: false,
  };

  it("gets undefined when not set", () => {
    expect(getSanityConfig(baseShop)).toBeUndefined();
  });

  it("sets and retrieves config", () => {
    const updated = setSanityConfig(baseShop, {
      projectId: "p",
      dataset: "d",
      token: "t",
    });
    expect(getSanityConfig(updated)).toEqual({
      projectId: "p",
      dataset: "d",
      token: "t",
    });
  });
});
