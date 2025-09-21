jest.mock("../shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

import { shopSchema } from "@acme/types";
import { updateShopInRepo } from "../shop.server";
import * as shops from "../shops.server";

const { writeShop } = shops;

describe("shops.repository — writeShop", () => {
  const updateRepo = updateShopInRepo as jest.Mock;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("merges theme data and calls updateShopInRepo with merged themeTokens", async () => {
    const current = shopSchema.parse({
      id: "shop1",
      name: "Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: { color: "red" },
      themeOverrides: { spacing: "8px" },
    });

    jest.spyOn(shops, "readShop").mockResolvedValue(current);

    const patch = {
      id: "shop1",
      themeDefaults: { spacing: "10px" },
      themeOverrides: { color: "green", margin: "1px" },
    };

    await writeShop("shop1", patch);

    expect(updateRepo).toHaveBeenCalledWith(
      "shop1",
      expect.objectContaining({
        themeDefaults: { color: "red", spacing: "10px" },
        themeOverrides: { spacing: "8px", color: "green", margin: "1px" },
        themeTokens: { color: "green", spacing: "8px", margin: "1px" },
      })
    );

    (shops.readShop as jest.Mock).mockRestore();
  });

  it("merges theme data and prunes overrides", async () => {
    const current = shopSchema.parse({
      id: "shop1",
      name: "Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: { color: "red" },
      themeOverrides: { color: "blue", spacing: "10px" },
    });

    jest.spyOn(shops, "readShop").mockResolvedValue(current);

    const patch = {
      id: "shop1",
      themeDefaults: { spacing: "10px", extraDefault: "value" },
      themeOverrides: {
        color: null,
        spacing: "10px",
        extraDefault: "value",
        newOverride: "15px",
      } as any,
    };

    const result = await writeShop("shop1", patch);

    expect(updateRepo).toHaveBeenCalledWith(
      "shop1",
      expect.objectContaining({
        id: "shop1",
        themeDefaults: {
          color: "red",
          spacing: "10px",
          extraDefault: "value",
        },
        themeOverrides: { newOverride: "15px" },
        themeTokens: {
          color: "red",
          spacing: "10px",
          extraDefault: "value",
          newOverride: "15px",
        },
      }),
    );

    expect(result.themeOverrides).toEqual({ newOverride: "15px" });

    (shops.readShop as jest.Mock).mockRestore();
  });

  it("prunes overrides that match defaults or are null", async () => {
    const current = shopSchema.parse({
      id: "shop2",
      name: "Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: { color: "red", spacing: "8px" },
      themeOverrides: {},
    });

    jest.spyOn(shops, "readShop").mockResolvedValue(current);

    const patch = {
      id: "shop2",
      themeDefaults: { spacing: "10px" },
      themeOverrides: { color: "red", spacing: null } as any,
    };

    const result = await writeShop("shop2", patch);

    expect(updateRepo).toHaveBeenCalledWith(
      "shop2",
      expect.objectContaining({
        themeDefaults: { color: "red", spacing: "10px" },
        themeOverrides: {},
        themeTokens: { color: "red", spacing: "10px" },
      })
    );
    expect(result.themeOverrides).toEqual({});

    (shops.readShop as jest.Mock).mockRestore();
  });
});

