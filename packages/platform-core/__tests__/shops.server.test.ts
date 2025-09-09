import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (dir: string) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shoprepo-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

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
          themeDefaults: { accent: "red" },
          themeOverrides: { accent: "blue" },
          filterMappings: {},
          priceOverrides: {},
          localeOverrides: {},
        }),
        updateShopInRepo: jest.fn(),
      }));

      const { readShop } = await import("../src/repositories/shops.server");
      const result = await readShop("test");
      expect(result.themeDefaults).toEqual({ accent: "red" });
      expect(result.themeTokens).toEqual({ accent: "blue" });
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

describe("writeShop", () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock("../src/repositories/shop.server");
  });
  it("merges theme data and removes duplicate overrides", async () => {
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
            themeOverrides: {},
            filterMappings: {},
            priceOverrides: {},
            localeOverrides: {},
          },
          null,
          2,
        ),
      );

      const { writeShop } = await import("../src/repositories/shops.server");
      const result = await writeShop("test", {
        id: "test",
        themeDefaults: { accent: "red" },
        themeOverrides: { accent: "red", extra: "green", drop: null },
      });
      expect(result.themeDefaults).toEqual({ accent: "red" });
      expect(result.themeOverrides).toEqual({ extra: "green" });
      expect(result.themeTokens).toEqual({ accent: "red", extra: "green" });
      expect(result.navigation).toEqual([]);
      delete process.env.SHOP_BACKEND;
    });
  });
});
