// packages/platform-core/__tests__/shops.test.ts
import {
  getSanityConfig,
  setSanityConfig,
  validateShopName,
} from "../src/shops";
import { baseTokens } from "../src/themeTokens";
import { tokens as bcdTokens } from "../../themes/bcd/src/tailwind-tokens";
import { tokens as darkTokens } from "../../themes/dark/src/tailwind-tokens";
import type { Shop } from "@acme/types";

describe("validateShopName", () => {
  it("trims and accepts safe names", () => {
    expect(validateShopName("  store_1 ")).toBe("store_1");
  });

  it("throws for invalid characters", () => {
    expect(() => validateShopName("bad/name")).toThrow("Invalid shop name");
  });
});

describe("sanity blog accessors", () => {
  const baseShop: Shop = {
    id: "shop",
    name: "shop",
    catalogFilters: [],
    themeId: "base",
    themeOverrides: {},
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

describe("theme overrides", () => {
  it("merges overrides with base tokens", () => {
    const overrides = { "--color-bg": "255 0% 50%" };
    const defaults = { ...baseTokens, ...bcdTokens };
    const merged = { ...defaults, ...overrides };
    expect(merged["--color-bg"]).toBe("255 0% 50%");
    // token missing from theme overrides falls back to base token
    expect(merged["--color-danger"]).toBe(baseTokens["--color-danger"]);
  });

  it("preserves overrides after theme changes", () => {
    const overrides = { "--color-bg": "255 0% 50%" };
    const newDefaults = { ...baseTokens, ...darkTokens };
    const merged = { ...newDefaults, ...overrides };
    expect(merged["--color-bg"]).toBe("255 0% 50%");
    // non-overridden tokens use new theme defaults
    expect(merged["--color-primary"]).toBe(darkTokens["--color-primary"]);
  });
});
