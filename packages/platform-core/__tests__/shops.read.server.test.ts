import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

// Single-purpose tests for readShop behaviour

const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(cb, { prefix: "shoprepo-" });

describe("readShop", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("../src/repositories/shop.server");
  });

  it("reads from the database and applies theme data", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("../src/repositories/shop.server", () => ({
        getShopById: jest.fn().mockResolvedValue({
          id: "test",
          name: "DB",
          catalogFilters: [],
          themeId: "base",
          themeDefaults: { "--color-accent": "red" },
          themeOverrides: { "--color-accent": "blue" },
          filterMappings: {},
          priceOverrides: {},
          localeOverrides: {},
        }),
        updateShopInRepo: jest.fn(),
      }));

      const { readShop } = await import("../src/repositories/shops.server");
      const result = await readShop("test");
      expect(result.themeDefaults).toEqual({ "--color-accent": "red" });
      expect(result.themeTokens).toEqual({ "--color-accent": "blue" });
    });
  });

  it("reads from the filesystem when the database is unavailable", async () => {
    await withRepo(async (dir) => {
      process.env.SHOP_BACKEND = "json";
      delete process.env.DATABASE_URL;
      const shopFile = path.join(dir, "data", "shops", "test", "shop.json");
      await fs.writeFile(
        shopFile,
        JSON.stringify(
          {
            id: "test",
            name: "Seed",
            catalogFilters: [],
            themeId: "base",
            themeDefaults: { accent: "blue" },
            themeOverrides: { accent: "green" },
            filterMappings: {},
            priceOverrides: {},
            localeOverrides: {},
          },
          null,
          2,
        ),
      );

      const { readShop } = await import("../src/repositories/shops.server");
      const result = await readShop("test");
      expect(result.name).toBe("Seed");
      expect(result.themeTokens).toEqual({ accent: "green" });
      delete process.env.SHOP_BACKEND;
    });
  });

  it("returns default shop when file is missing", async () => {
    await withRepo(async () => {
      process.env.SHOP_BACKEND = "json";
      delete process.env.DATABASE_URL;
      const loadThemeTokens = jest.fn().mockResolvedValue({ fromTheme: "t" });
      jest.doMock("../src/themeTokens/index", () => ({
        baseTokens: { base: "b" },
        loadThemeTokens,
      }));
      const { readShop } = await import("../src/repositories/shops.server");
      const result = await readShop("test");
      expect(loadThemeTokens).toHaveBeenCalledWith("base");
      expect(result.themeDefaults).toEqual({ base: "b", fromTheme: "t" });
      expect(result.themeTokens).toEqual({ base: "b", fromTheme: "t" });
      delete process.env.SHOP_BACKEND;
    });
  });
});

