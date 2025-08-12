import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
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

describe("shop repository", () => {
  it("persists themeDefaults", async () => {
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

      const { updateShopInRepo } = await import("../src/repositories/shop.server");
      const { readShop } = await import("../src/repositories/shops.server");

      const defaults = { base: "default", accent: "blue" };
      const overrides = { accent: "red" };

      await updateShopInRepo("test", {
        id: "test",
        themeDefaults: defaults,
        themeOverrides: overrides,
        themeTokens: { ...defaults, ...overrides },
      });

      const saved = await readShop("test");
      expect(saved.themeDefaults).toEqual(defaults);
      expect(saved.themeTokens).toEqual({ ...defaults, ...overrides });
    });
  });
});
