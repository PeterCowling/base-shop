import { promises as fs } from "fs";

import { prisma } from "../../db";
import { getShopById } from "../shop.server";
import * as shops from "../shops.server";

jest.mock("../shop.server", () => ({
  getShopById: jest.fn(),
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

jest.mock("../../themeTokens/index", () => ({
  baseTokens: { base: "base" },
  loadThemeTokens: jest.fn(async () => ({ theme: "theme" })),
}));

const { listShops } = shops;

describe("shops.repository — listShops", () => {
  const getRepo = getShopById as jest.Mock;
  let findMany: jest.SpyInstance;
  let count: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    getRepo.mockReset();
    (prisma.shop as any).findMany = async () => [];
    (prisma.shop as any).count = async () => 0;
    findMany = jest.spyOn(prisma.shop, "findMany");
    count = jest.spyOn(prisma.shop, "count");
  });

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

