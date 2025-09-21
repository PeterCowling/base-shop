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

const { readShop } = shops;

describe("shops.repository — readShop", () => {
  const updateRepo = updateShopInRepo as jest.Mock;
  const loadTokens = loadThemeTokens as jest.Mock;
  const getRepo = getShopById as jest.Mock;
  let findUnique: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    getRepo.mockReset();
    (prisma.shop as any).findMany = async () => [];
    (prisma.shop as any).count = async () => 0;
    findUnique = jest.spyOn(prisma.shop, "findUnique");
  });

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

