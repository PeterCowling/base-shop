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
  it("reads from the database and applies theme data", async () => {
    jest.resetModules();
    jest.doMock("../src/db", () => ({
      prisma: {
        shop: {
          findUnique: jest.fn().mockResolvedValue({
            id: "test",
            data: {
              id: "test",
              name: "DB",
              catalogFilters: [],
              themeId: "base",
              themeDefaults: { accent: "red" },
              themeOverrides: { accent: "blue" },
              filterMappings: {},
              priceOverrides: {},
              localeOverrides: {},
            },
          }),
        },
      },
    }));

    const { readShop } = await import("../src/repositories/shops.server");
    const result = await readShop("test");
    expect(result.themeDefaults).toEqual({ accent: "red" });
    expect(result.themeTokens).toEqual({ accent: "blue" });
  });

  it("falls back to filesystem when the database fails", async () => {
    await withRepo(async (dir) => {
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

      jest.doMock("../src/db", () => ({
        prisma: {
          shop: {
            findUnique: jest.fn().mockRejectedValue(new Error("db fail")),
          },
        },
      }));

      const { readShop } = await import("../src/repositories/shops.server");
      const result = await readShop("test");
      expect(result.name).toBe("Seed");
      expect(result.themeTokens).toEqual({ accent: "green" });
    });
  });

  it("returns default shop when file is missing", async () => {
    await withRepo(async () => {
      jest.doMock("../src/db", () => ({
        prisma: { shop: { findUnique: jest.fn().mockResolvedValue(null) } },
      }));
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
    });
  });
});

describe("writeShop", () => {
  it("merges theme data and removes duplicate overrides", async () => {
    await withRepo(async (dir) => {
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

      jest.doMock("../src/db", () => ({
        prisma: {
          shop: {
            findUnique: jest.fn().mockResolvedValue(null),
            upsert: jest.fn().mockRejectedValue(new Error("no db")),
          },
        },
      }));

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
    });
  });
});
