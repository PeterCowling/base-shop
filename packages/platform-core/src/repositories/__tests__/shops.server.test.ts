jest.mock("../shop.server", () => ({
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

import { shopSchema } from "@acme/types";
import { updateShopInRepo } from "../shop.server";
import { loadThemeTokens } from "../../themeTokens/index";
import { prisma } from "../../db";
import * as shops from "../shops.server";

const { readShop, writeShop, listShops } = shops;

describe("shops.repository", () => {
  const updateRepo = updateShopInRepo as jest.Mock;
  const loadTokens = loadThemeTokens as jest.Mock;
  let findUnique: jest.SpyInstance;
  let findMany: jest.SpyInstance;
  let count: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    findUnique = jest.spyOn(prisma.shop, "findUnique");
    findMany = jest.spyOn(prisma.shop, "findMany");
    count = jest.spyOn(prisma.shop, "count");
  });

  describe("readShop", () => {
    it("returns shop from repository", async () => {
      const repoData = {
        id: "repo-shop",
        name: "Repo Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "green" },
        themeOverrides: { color: "blue" },
      };
      findUnique.mockResolvedValue({ data: repoData });

      const result = await readShop("repo-shop");

      expect(result.name).toBe("Repo Shop");
      expect(result.themeDefaults).toEqual({ color: "green" });
      expect(result.themeTokens).toEqual({ color: "blue" });
      expect(loadTokens).not.toHaveBeenCalled();
    });

    it("returns default shop when repository throws", async () => {
      findUnique.mockRejectedValue(new Error("missing"));
      const result = await readShop("new-shop");
      expect(result.id).toBe("new-shop");
      expect(result.name).toBe("new-shop");
    });

    it("loads theme tokens when defaults are missing", async () => {
      findUnique.mockResolvedValue({
        data: {
          id: "shop-no-defaults",
          name: "No Defaults",
          catalogFilters: [],
          themeId: "base",
          filterMappings: {},
          themeOverrides: { color: "blue" },
        },
      });

      const result = await readShop("shop-no-defaults");

      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(result.themeOverrides).toEqual({ color: "blue" });
      expect(result.themeTokens).toEqual({
        base: "base",
        theme: "theme",
        color: "blue",
      });
      expect(loadTokens).toHaveBeenCalledWith("base");
    });

    it("sets empty overrides when overrides are missing", async () => {
      findUnique.mockResolvedValue({
        data: {
          id: "shop-no-overrides",
          name: "No Overrides",
          catalogFilters: [],
          themeId: "base",
          filterMappings: {},
          themeDefaults: { color: "green" },
        },
      });

      const result = await readShop("shop-no-overrides");

      expect(result.themeDefaults).toEqual({ color: "green" });
      expect(result.themeOverrides).toEqual({});
      expect(result.themeTokens).toEqual({ color: "green" });
    });
  });

  describe("writeShop", () => {
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
  });
  describe("listShops", () => {
    it("returns empty list when no shops exist", async () => {
      count.mockResolvedValue(0);
      const result = await listShops(1, 5);
      expect(result).toEqual([]);
      expect(findMany).not.toHaveBeenCalled();
    });

    it("clamps page within bounds", async () => {
      count.mockResolvedValue(5);
      findMany.mockResolvedValue([]);

      await listShops(0, 2);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 2 })
      );

      findMany.mockClear();
      await listShops(10, 2);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 4, take: 2 })
      );
    });
  });
});

