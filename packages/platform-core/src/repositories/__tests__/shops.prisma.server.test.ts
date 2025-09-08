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

jest.mock("../shop.prisma.server", () => ({
  updateShopInRepo: jest.fn(async (_shop: string, patch: any) => patch),
}));

import { prisma } from "../../db";
import { loadThemeTokens } from "../../themeTokens/index";
import { readShop, writeShop } from "../shops.prisma.server";
import { updateShopInRepo } from "../shop.prisma.server";

describe("shops.prisma.server", () => {
  const findUnique = prisma.shop.findUnique as jest.Mock;
  const updateRepo = updateShopInRepo as jest.Mock;
  const loadTokens = loadThemeTokens as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns shop from Prisma when available", async () => {
    const dbData = {
      id: "db-shop",
      name: "DB Shop",
      catalogFilters: [],
      themeId: "base",
      filterMappings: {},
      themeDefaults: { color: "green" },
      themeOverrides: { color: "blue" },
    };
    findUnique.mockResolvedValue({ data: dbData });

    const result = await readShop("db-shop");

    expect(result.name).toBe("DB Shop");
    expect(loadTokens).not.toHaveBeenCalled();
  });

  it("returns default shop when Prisma returns null", async () => {
    findUnique.mockResolvedValue(null);

    const result = await readShop("missing");

    expect(result.id).toBe("missing");
    expect(loadTokens).toHaveBeenCalled();
  });

  it("writes shop via updateShopInRepo", async () => {
    findUnique.mockResolvedValue({
      data: {
        id: "shop1",
        name: "Shop",
        catalogFilters: [],
        themeId: "base",
        filterMappings: {},
        themeDefaults: {},
        themeOverrides: {},
      },
    });

    const result = await writeShop("shop1", { id: "shop1", name: "Updated" });

    expect(updateRepo).toHaveBeenCalled();
    expect(result.name).toBe("Updated");
  });
});

