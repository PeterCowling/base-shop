jest.mock("../../dataRoot", () => ({
  DATA_ROOT: "/data/root",
}));

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
  },
}));

jest.mock("../../db", () => ({
  prisma: {
    shop: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { promises as fs } from "fs";
import * as path from "path";
import { shopSchema } from "@acme/types";
import { prisma } from "../../db";
import { getShopById, updateShopInRepo } from "../shop.server";

describe("shop repository", () => {
  const findUnique = prisma.shop.findUnique as jest.Mock;
  const upsert = prisma.shop.upsert as jest.Mock;
  const readFile = fs.readFile as jest.Mock;
  const mkdir = fs.mkdir as jest.Mock;
  const writeFile = fs.writeFile as jest.Mock;
  const rename = fs.rename as jest.Mock;

  const rawShopData = {
    id: "shop1",
    name: "Shop",
    catalogFilters: [],
    themeId: "theme",
    filterMappings: {},
  };
  const shopData = shopSchema.parse(rawShopData);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getShopById", () => {
    it("returns shop data from the database", async () => {
      findUnique.mockResolvedValue({ id: "shop1", data: rawShopData });
      await expect(getShopById("shop1")).resolves.toEqual(shopData);
      expect(readFile).not.toHaveBeenCalled();
    });

    it("falls back to filesystem when the database throws", async () => {
      findUnique.mockRejectedValue(new Error("db error"));
      readFile.mockResolvedValue(JSON.stringify(rawShopData));
      await expect(getShopById("shop1")).resolves.toEqual(shopData);
      expect(readFile).toHaveBeenCalled();
    });

    it("falls back to filesystem when the database returns no record", async () => {
      findUnique.mockResolvedValue(null);
      readFile.mockResolvedValue(JSON.stringify(rawShopData));
      await expect(getShopById("shop1")).resolves.toEqual(shopData);
      expect(readFile).toHaveBeenCalled();
    });

    it("throws when the shop is missing", async () => {
      findUnique.mockResolvedValue(null);
      readFile.mockRejectedValue(new Error("not found"));
      await expect(getShopById("missing")).rejects.toThrow(
        "Shop missing not found",
      );
    });
  });

  describe("updateShopInRepo", () => {
    beforeEach(() => {
      findUnique.mockResolvedValue({ id: "shop1", data: rawShopData });
    });

    it("upserts the shop in the database", async () => {
      upsert.mockResolvedValue(undefined);
      const result = await updateShopInRepo("shop1", {
        id: "shop1",
        name: "Updated",
      });
      expect(result).toEqual({ ...shopData, name: "Updated" });
      expect(upsert).toHaveBeenCalledWith({
        where: { id: "shop1" },
        create: { id: "shop1", data: { ...shopData, name: "Updated" } },
        update: { data: { ...shopData, name: "Updated" } },
      });
      expect(writeFile).not.toHaveBeenCalled();
      expect(rename).not.toHaveBeenCalled();
    });

    it("persists to the filesystem when the database upsert fails", async () => {
      upsert.mockRejectedValue(new Error("db fail"));
      const now = 123456;
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(now);

      const result = await updateShopInRepo("shop1", {
        id: "shop1",
        name: "Offline",
      });
      expect(result).toEqual({ ...shopData, name: "Offline" });

      const file = path.join("/data/root", "shop1", "shop.json");
      const tmp = `${file}.${now}.tmp`;

      expect(mkdir).toHaveBeenCalledWith(path.dirname(file), {
        recursive: true,
      });
      expect(writeFile).toHaveBeenCalledWith(
        tmp,
        JSON.stringify({ ...shopData, name: "Offline" }, null, 2),
        "utf8",
      );
      expect(rename).toHaveBeenCalledWith(tmp, file);

      nowSpy.mockRestore();
    });

    it("throws when the patch id does not match", async () => {
      await expect(
        updateShopInRepo("shop1", { id: "other" } as any),
      ).rejects.toThrow("Shop other not found in shop1");
      expect(upsert).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
    });
  });
});

