jest.mock("../shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

import { shopSchema } from "@acme/types";
import { updateShopInRepo, getShopById } from "../shop.server";
import { loadThemeTokens } from "../../themeTokens/index";
import { prisma } from "../../db";
import * as shops from "../shops.server";
import { defaultFilterMappings } from "../../defaultFilterMappings";
import { promises as fs } from "fs";

const { readShop, writeShop, listShops, applyThemeData } = shops;

describe("shops.repository", () => {
  const updateRepo = updateShopInRepo as jest.Mock;
  const loadTokens = loadThemeTokens as jest.Mock;
  const getRepo = getShopById as jest.Mock;
  let findUnique: jest.SpyInstance;
  let findMany: jest.SpyInstance;
  let count: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    getRepo.mockReset();
    (prisma.shop as any).findMany = async () => [];
    (prisma.shop as any).count = async () => 0;
    findUnique = jest.spyOn(prisma.shop, "findUnique");
    findMany = jest.spyOn(prisma.shop, "findMany");
    count = jest.spyOn(prisma.shop, "count");
  });

  describe("applyThemeData", () => {
    it("loads tokens when defaults are empty", async () => {
      const data = shopSchema.parse({
        id: "shop-theme",
        name: "Theme Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: {},
        themeOverrides: {},
      });

      const result = await applyThemeData(data);

      expect(loadTokens).toHaveBeenCalledWith("base");
      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(result.themeTokens).toEqual({ base: "base", theme: "theme" });
    });
  });

  describe("readShop", () => {
    it("returns shop from repository", async () => {
      const repoData = {
        id: "repo-shop",
        name: "Repo Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: { brand: "brand", extra: "x" },
        themeDefaults: { color: "green" },
        themeOverrides: { color: "blue" },
      };
      getRepo.mockResolvedValue(repoData);
      const readFile = jest.spyOn(fs, "readFile");

      const result = await readShop("repo-shop");

      expect(getRepo).toHaveBeenCalledWith("repo-shop");
      expect(result.name).toBe("Repo Shop");
      expect(result.themeDefaults).toEqual({ color: "green" });
      expect(result.themeTokens).toEqual({ color: "blue" });
      expect(result.filterMappings).toEqual({ brand: "brand", extra: "x" });
      expect(findUnique).not.toHaveBeenCalled();
      expect(readFile).not.toHaveBeenCalled();
      expect(loadTokens).not.toHaveBeenCalled();
    });

    it(
      "falls back to prisma when repository lookup fails, applying theme tokens and mappings",
      async () => {
        const repoData = {
          id: "repo-shop",
          name: "Repo Shop",
          catalogFilters: [],
          themeId: "base",
          filterMappings: { brand: "brand" },
          themeDefaults: { color: "green" },
          themeOverrides: { color: "blue" },
        };
        getRepo.mockRejectedValue(new Error("missing"));
        findUnique.mockResolvedValue({ data: repoData });
        const readFile = jest.spyOn(fs, "readFile");

        const result = await readShop("repo-shop");

        expect(findUnique).toHaveBeenCalledWith({
          where: { id: "repo-shop" },
        });
        expect(result.name).toBe("Repo Shop");
        expect(result.filterMappings).toEqual({ brand: "brand" });
        expect(result.themeDefaults).toEqual({ color: "green" });
        expect(result.themeOverrides).toEqual({ color: "blue" });
        expect(result.themeTokens).toEqual({ color: "blue" });
        expect(loadTokens).not.toHaveBeenCalled();
        expect(readFile).not.toHaveBeenCalled();
      },
    );

    it(
      "uses filesystem when repository and Prisma fail, applying theme tokens and mappings",
      async () => {
        const fileData = {
          id: "fs-shop",
          name: "FS Shop",
          catalogFilters: [],
          themeId: "base",
          filterMappings: { brand: "brand" },
          themeDefaults: { color: "green" },
          themeOverrides: { color: "blue" },
        };
        getRepo.mockRejectedValue(new Error("missing"));
        findUnique.mockRejectedValue(new Error("db down"));
        const readFile = jest
          .spyOn(fs, "readFile")
          .mockResolvedValue(JSON.stringify(fileData));

        const result = await readShop("fs-shop");

        expect(readFile).toHaveBeenCalledWith(
          expect.stringContaining("/fs-shop/shop.json"),
          "utf8"
        );
        expect(result.name).toBe("FS Shop");
        expect(result.filterMappings).toEqual({ brand: "brand" });
        expect(result.themeDefaults).toEqual({ color: "green" });
        expect(result.themeOverrides).toEqual({ color: "blue" });
        expect(result.themeTokens).toEqual({ color: "blue" });
        expect(loadTokens).not.toHaveBeenCalled();
      },
    );

    it("reads from filesystem when Prisma returns null", async () => {
      const fileData = {
        id: "fs-shop",
        name: "FS Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "green" },
        themeOverrides: { color: "blue" },
      };
      getRepo.mockRejectedValue(new Error("missing"));
      findUnique.mockResolvedValue(null);
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue(JSON.stringify(fileData));

      const result = await readShop("fs-shop");

      expect(findUnique).toHaveBeenCalledWith({ where: { id: "fs-shop" } });
      expect(readFile).toHaveBeenCalled();
      expect(result.name).toBe("FS Shop");
    });

    it("falls back when prisma data is invalid", async () => {
      const fileData = {
        id: "fs-shop",
        name: "FS Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "green" },
        themeOverrides: { color: "blue" },
      };
      getRepo.mockRejectedValue(new Error("missing"));
      findUnique.mockResolvedValue({ data: { invalid: true } });
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue(JSON.stringify(fileData));

      const result = await readShop("fs-shop");

      expect(findUnique).toHaveBeenCalledWith({ where: { id: "fs-shop" } });
      expect(readFile).toHaveBeenCalled();
      expect(result.name).toBe("FS Shop");
    });

    it("returns default shop when all sources fail", async () => {
      getRepo.mockRejectedValue(new Error("missing"));
      findUnique.mockRejectedValue(new Error("db down"));
      jest.spyOn(fs, "readFile").mockRejectedValue(new Error("missing"));

      const result = await readShop("new-shop");

      expect(result.id).toBe("new-shop");
      expect(result.name).toBe("new-shop");
      expect(result.filterMappings).toEqual(defaultFilterMappings);
      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(result.themeOverrides).toEqual({});
      expect(result.themeTokens).toEqual({ base: "base", theme: "theme" });
      expect(loadTokens).toHaveBeenCalledWith("base");
    });

    it("returns default shop when filesystem JSON is invalid", async () => {
      getRepo.mockRejectedValue(new Error("missing"));
      findUnique.mockRejectedValue(new Error("db down"));
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue("not json");

      const result = await readShop("json-error");

      expect(readFile).toHaveBeenCalled();
      expect(result.id).toBe("json-error");
      expect(result.name).toBe("json-error");
      expect(result.filterMappings).toEqual(defaultFilterMappings);
      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(result.themeOverrides).toEqual({});
      expect(result.themeTokens).toEqual({ base: "base", theme: "theme" });
      expect(loadTokens).toHaveBeenCalledWith("base");
    });

    it("returns default shop when filesystem JSON fails validation", async () => {
      getRepo.mockRejectedValue(new Error("missing"));
      findUnique.mockRejectedValue(new Error("db down"));
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue(JSON.stringify({ id: "fs-shop" }));

      const result = await readShop("schema-error");

      expect(readFile).toHaveBeenCalled();
      expect(result.id).toBe("schema-error");
      expect(result.name).toBe("schema-error");
      expect(result.filterMappings).toEqual(defaultFilterMappings);
      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(result.themeOverrides).toEqual({});
      expect(result.themeTokens).toEqual({ base: "base", theme: "theme" });
      expect(loadTokens).toHaveBeenCalledWith("base");
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

    it.each([0, -5])(
      "clamps limit within bounds (limit=%s)",
      async (limit) => {
        count.mockResolvedValue(1);
        findMany.mockResolvedValue([]);

        await listShops(1, limit);

        expect(findMany).toHaveBeenCalledWith(
          expect.objectContaining({ skip: 0, take: 1 })
        );
      },
    );

    it("returns items from the last page when page equals max", async () => {
      count.mockResolvedValue(5);
      findMany.mockResolvedValue([{ id: "shop5" }]);
      const result = await listShops(3, 2);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 4, take: 2 })
      );
      expect(result).toEqual(["shop5"]);
    });

    it("falls back to filesystem when database calls fail", async () => {
      count.mockRejectedValue(new Error("db down"));
      jest
        .spyOn(fs, "readdir")
        .mockResolvedValue([
          { isDirectory: () => true, name: "a" },
          { isDirectory: () => true, name: "b" },
          { isDirectory: () => true, name: "c" },
        ] as any);
      const result = await listShops(2, 2);
      expect(result).toEqual(["c"]);
    });

    it("returns [] when filesystem has no directories", async () => {
      count.mockRejectedValue(new Error("db down"));
      jest.spyOn(fs, "readdir").mockResolvedValue([] as any);

      const result = await listShops(1, 5);
      expect(result).toEqual([]);
    });

    it("returns [] when filesystem access fails", async () => {
      count.mockRejectedValue(new Error("db down"));
      jest.spyOn(fs, "readdir").mockRejectedValue(new Error("no fs"));

      const result = await listShops(1, 5);
      expect(result).toEqual([]);
    });
  });
});

