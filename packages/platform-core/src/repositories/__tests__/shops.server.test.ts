jest.mock("../../dataRoot", () => ({
  DATA_ROOT: "/data/root",
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("../../db", () => ({
  prisma: {
    shop: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

jest.mock("../shop.server", () => ({
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

import { promises as fs } from "fs";
import { prisma } from "../../db";
import { shopSchema } from "@acme/types";
import * as shops from "../shops.server";
import { updateShopInRepo } from "../shop.server";
import { loadThemeTokens } from "../../themeTokens/index";

const { readShop, writeShop } = shops;

describe("shops repository", () => {
  const findUnique = prisma.shop.findUnique as jest.Mock;
  const readFile = fs.readFile as jest.Mock;
  const updateRepo = updateShopInRepo as jest.Mock;
  const loadTokens = loadThemeTokens as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("readShop", () => {
    it("falls back to filesystem when Prisma fails", async () => {
      findUnique.mockRejectedValue(new Error("db fail"));
      const fileData = {
        id: "shop1",
        name: "FS Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "red" },
        themeOverrides: { color: "blue" },
      };
      readFile.mockResolvedValue(JSON.stringify(fileData));

      const result = await readShop("shop1");

      expect(result.name).toBe("FS Shop");
      expect(result.themeDefaults).toEqual({ color: "red" });
      expect(result.themeOverrides).toEqual({ color: "blue" });
      expect(findUnique).toHaveBeenCalled();
      expect(readFile).toHaveBeenCalledWith(
        "/data/root/shop1/shop.json",
        "utf8",
      );
    });

    it("returns empty shop with defaults when db and fs fail", async () => {
      findUnique.mockRejectedValue(new Error("db fail"));
      readFile.mockRejectedValue(new Error("fs fail"));

      const result = await readShop("missing");

      expect(result.id).toBe("missing");
      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(result.themeOverrides).toEqual({});
      expect(result.themeTokens).toEqual({ base: "base", theme: "theme" });
      expect(loadTokens).toHaveBeenCalled();
    });

    it("uses default tokens when themeDefaults is empty", async () => {
      findUnique.mockRejectedValue(new Error("db fail"));
      const fileData = {
        id: "shop2",
        name: "No Defaults",
        catalogFilters: [],
        themeId: "other",
        themeDefaults: {},
        filterMappings: {},
      };
      readFile.mockResolvedValue(JSON.stringify(fileData));

      const result = await readShop("shop2");

      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(loadTokens).toHaveBeenCalledWith("other");
    });
  });

  describe("writeShop", () => {
    it("merges theme data and prunes overrides", async () => {
      const current = {
        ...shopSchema.parse({
          id: "shop1",
          name: "Shop",
          catalogFilters: [],
          themeId: "base",
          filterMappings: {},
          themeDefaults: { color: "red" },
          themeOverrides: { color: "blue", spacing: "10px" },
        }),
      } as any;

      const readSpy = jest
        .spyOn(shops, "readShop")
        .mockResolvedValue(current);

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
      expect(result.themeTokens).toEqual({
        color: "red",
        spacing: "10px",
        extraDefault: "value",
        newOverride: "15px",
      });

      readSpy.mockRestore();
    });
  });
});

