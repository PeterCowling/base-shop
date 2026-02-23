import { shopSchema } from "@acme/types";

import { updateShopInRepo } from "../shop.server";
import * as shops from "../shops.server";

jest.mock("../shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

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
      themeDefaults: { "--radius-sm": "4px" },
      themeOverrides: { "--radius-md": "8px" },
    });

    jest.spyOn(shops, "readShop").mockResolvedValue(current);

    const patch = {
      id: "shop1",
      themeDefaults: { "--radius-md": "10px" },
      themeOverrides: { "--radius-sm": "6px", "--radius-lg": "12px" },
    };

    await writeShop("shop1", patch);

    expect(updateRepo).toHaveBeenCalledWith(
      "shop1",
      expect.objectContaining({
        themeDefaults: { "--radius-sm": "4px", "--radius-md": "10px" },
        themeOverrides: {
          "--radius-md": "8px",
          "--radius-sm": "6px",
          "--radius-lg": "12px",
        },
        themeTokens: {
          "--radius-md": "8px",
          "--radius-sm": "6px",
          "--radius-lg": "12px",
        },
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
      themeDefaults: { "--radius-sm": "4px" },
      themeOverrides: { "--radius-sm": "6px", "--radius-md": "10px" },
    });

    jest.spyOn(shops, "readShop").mockResolvedValue(current);

    const patch = {
      id: "shop1",
      themeDefaults: { "--radius-md": "10px", "--radius-lg": "12px" },
      themeOverrides: {
        "--radius-sm": null,
        "--radius-md": "10px",
        "--radius-lg": "12px",
        "--radius-xl": "16px",
      } as any,
    };

    const result = await writeShop("shop1", patch);

    expect(updateRepo).toHaveBeenCalledWith(
      "shop1",
      expect.objectContaining({
        id: "shop1",
        themeDefaults: {
          "--radius-sm": "4px",
          "--radius-md": "10px",
          "--radius-lg": "12px",
        },
        themeOverrides: { "--radius-xl": "16px" },
        themeTokens: {
          "--radius-sm": "4px",
          "--radius-md": "10px",
          "--radius-lg": "12px",
          "--radius-xl": "16px",
        },
      }),
    );

    expect(result.themeOverrides).toEqual({ "--radius-xl": "16px" });

    (shops.readShop as jest.Mock).mockRestore();
  });

  it("prunes overrides that match defaults or are null", async () => {
    const current = shopSchema.parse({
      id: "shop2",
      name: "Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: { "--radius-sm": "4px", "--radius-md": "8px" },
      themeOverrides: {},
    });

    jest.spyOn(shops, "readShop").mockResolvedValue(current);

    const patch = {
      id: "shop2",
      themeDefaults: { "--radius-md": "10px" },
      themeOverrides: { "--radius-sm": "4px", "--radius-md": null } as any,
    };

    const result = await writeShop("shop2", patch);

    expect(updateRepo).toHaveBeenCalledWith(
      "shop2",
      expect.objectContaining({
        themeDefaults: { "--radius-sm": "4px", "--radius-md": "10px" },
        themeOverrides: {},
        themeTokens: { "--radius-sm": "4px", "--radius-md": "10px" },
      })
    );
    expect(result.themeOverrides).toEqual({});

    (shops.readShop as jest.Mock).mockRestore();
  });

  it("rejects unresolved color references in theme writes", async () => {
    const current = shopSchema.parse({
      id: "shop3",
      name: "Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: {
        "--color-bg": "0 0% 100%",
        "--color-fg": "0 0% 10%",
      },
      themeOverrides: {},
    });

    jest.spyOn(shops, "readShop").mockResolvedValue(current);

    await expect(
      writeShop("shop3", {
        id: "shop3",
        themeOverrides: { "--color-fg": "var(--missing-token)" },
      } as any),
    ).rejects.toThrow("Theme validation failed");

    expect(updateRepo).not.toHaveBeenCalled();

    (shops.readShop as jest.Mock).mockRestore();
  });
});
