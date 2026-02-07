import fs from "node:fs/promises";
import path from "node:path";

import { withTempRepo } from "@acme/test-utils";

const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(cb, { prefix: 'shoprepo-' });

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
