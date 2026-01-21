import fs from "node:fs/promises";
import path from "node:path";

import { withTempRepo } from "@acme/test-utils";

// Single-purpose tests for writeShop behaviour

const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(cb, { prefix: "shoprepo-" });

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
