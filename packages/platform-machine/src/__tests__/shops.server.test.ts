jest.mock("@acme/platform-core/dataRoot", () => ({
  DATA_ROOT: "/data",
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

jest.mock("@acme/platform-core/db", () => ({
  prisma: {
    shop: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock("@acme/types", () => ({
  shopSchema: {
    parse: jest.fn(),
    safeParse: jest.fn(),
  },
  shopSettingsSchema: {
    partial: jest.fn(() => ({})),
  },
}));

jest.mock("@acme/platform-core/repositories/shop.server", () => ({
  getShopById: jest.fn(async (shop: string) => {
    const { prisma } = jest.requireMock("@acme/platform-core/db");
    const { shopSchema } = jest.requireMock("@acme/types");
    const rec = await prisma.shop.findUnique({ where: { id: shop } });
    if (!rec) throw new Error(`Shop ${shop} not found`);
    return shopSchema.parse(rec.data);
  }),
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("@acme/platform-core/themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

import { promises as fs } from "fs";
import { prisma } from "@acme/platform-core/db";
import { shopSchema } from "@acme/types";
import { updateShopInRepo } from "@acme/platform-core/repositories/shop.server";
import * as shops from "@acme/platform-core/repositories/shops.server";

const { readShop, writeShop } = shops;

describe("shops repository", () => {
  const findUnique = prisma.shop.findUnique as jest.Mock;
  const readFile = fs.readFile as jest.Mock;
  const parse = shopSchema.parse as jest.Mock;
  const safeParse = shopSchema.safeParse as jest.Mock;
  const updateRepo = updateShopInRepo as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("readShop", () => {
    it("returns shop from database when available", async () => {
      const dbData = {
        id: "db-shop",
        name: "DB Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "red" },
        themeOverrides: { color: "blue" },
      };
      findUnique.mockResolvedValue({ data: dbData });
      parse.mockReturnValue(dbData);

      const result = await readShop("db-shop");

      expect(result.themeDefaults).toEqual({ color: "red" });
      expect(result.themeOverrides).toEqual({ color: "blue" });
      expect(result.themeTokens).toEqual({ color: "blue" });
      expect(readFile).not.toHaveBeenCalled();
      expect(parse).toHaveBeenCalledWith(dbData);
    });

    it("falls back to filesystem when database lookup fails", async () => {
      findUnique.mockRejectedValue(new Error("db error"));
      const fileData = {
        id: "fs-shop",
        name: "FS Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "red" },
        themeOverrides: { color: "blue" },
      };
      readFile.mockResolvedValue(JSON.stringify(fileData));
      safeParse.mockReturnValue({ success: true, data: fileData });

      const result = await readShop("fs-shop");

      expect(result.themeDefaults).toEqual({ color: "red" });
      expect(result.themeOverrides).toEqual({ color: "blue" });
      expect(result.themeTokens).toEqual({ color: "blue" });
      expect(readFile).toHaveBeenCalledWith("/data/fs-shop/shop.json", "utf8");
      expect(parse).not.toHaveBeenCalled();
    });

    it("returns default shop when neither source is available", async () => {
      findUnique.mockResolvedValue(null);
      readFile.mockRejectedValue(new Error("missing"));

      const result = await readShop("missing");

      expect(result.id).toBe("missing");
      expect(result.themeDefaults).toEqual({ base: "base", theme: "theme" });
      expect(result.themeOverrides).toEqual({});
      expect(result.themeTokens).toEqual({ base: "base", theme: "theme" });
    });
  });

  describe("writeShop", () => {
    it("merges theme data and prunes matching overrides", async () => {
      const current = {
        id: "shop1",
        name: "Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: { color: "red" },
        themeOverrides: { color: "blue" },
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

