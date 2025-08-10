// packages/platform-core/__tests__/shops.test.ts
import { getSanityConfig, setSanityConfig, validateShopName } from "../shops";
import type { Shop } from "@types";

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
