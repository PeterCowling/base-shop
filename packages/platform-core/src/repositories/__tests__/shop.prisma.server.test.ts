jest.mock("../../db", () => ({
  prisma: {
    shop: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from "../../db";
import { shopSchema } from "@acme/types";
import { getShopById, updateShopInRepo } from "../shop.prisma.server";

describe("shop.prisma.server", () => {
  const findUnique = prisma.shop.findUnique as jest.Mock;
  const upsert = prisma.shop.upsert as jest.Mock;

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

  it("returns shop data from the database", async () => {
    findUnique.mockResolvedValue({ id: "shop1", data: rawShopData });
    await expect(getShopById("shop1")).resolves.toEqual(shopData);
  });

  it("upserts the shop in the database", async () => {
    findUnique.mockResolvedValue({ id: "shop1", data: rawShopData });
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
  });
});

