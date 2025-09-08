jest.mock("../shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

import { shopSchema } from "@acme/types";
import { getShopById, updateShopInRepo } from "../shop.server";
import { loadThemeTokens } from "../../themeTokens/index";
import * as shops from "../shops.server";

const { readShop, writeShop } = shops;

describe("shops.repository", () => {
  const getRepo = getShopById as jest.Mock;
  const updateRepo = updateShopInRepo as jest.Mock;
  const loadTokens = loadThemeTokens as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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
      getRepo.mockResolvedValue(repoData);

      const result = await readShop("repo-shop");

      expect(result.name).toBe("Repo Shop");
      expect(result.themeDefaults).toEqual({ color: "green" });
      expect(result.themeTokens).toEqual({ color: "blue" });
      expect(loadTokens).not.toHaveBeenCalled();
    });

    it("returns default shop when repository throws", async () => {
      getRepo.mockRejectedValue(new Error("missing"));
      const result = await readShop("new-shop");
      expect(result.id).toBe("new-shop");
      expect(result.name).toBe("new-shop");
    });

    it("loads theme tokens when defaults are missing", async () => {
      getRepo.mockResolvedValue({
        id: "shop-no-defaults",
        name: "No Defaults",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeOverrides: { color: "blue" },
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
      getRepo.mockResolvedValue({
        id: "shop-no-overrides",
        name: "No Overrides",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "green" },
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
});

