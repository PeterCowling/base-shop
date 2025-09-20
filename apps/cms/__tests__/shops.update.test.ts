import fs from "node:fs/promises";
import path from "node:path";
import { withShop, seedShop, mockShop } from "@acme/test-utils";

jest.setTimeout(20000);

afterEach(() => jest.resetAllMocks());

describe("updateShop flow", () => {
  it("persists theme overrides and defaults after reload", async () => {
    await withShop(async (dir) => {
      await seedShop(dir, {
        id: "test",
        name: "Seed",
        catalogFilters: [],
        themeId: "base",
        themeDefaults: {},
        themeOverrides: {},
        themeTokens: {},
        filterMappings: {},
        priceOverrides: {},
        localeOverrides: {},
      });

      const defaultTokens = {
        base: "default",
        accent: "blue",
        "accent-dark": "navy",
      };
      mockShop(defaultTokens);

      const { updateShop } = await import("../src/services/shops");

      const overrides = { accent: "red", "accent-dark": "black" };
      const fd = new FormData();
      fd.append("id", "test");
      fd.append("name", "Updated");
      fd.append("themeId", "base");
      fd.append("themeOverrides", JSON.stringify(overrides));

      const result = await updateShop("test", fd);

      const shopFile = path.join(dir, "data", "shops", "test", "shop.json");
      const saved = JSON.parse(await fs.readFile(shopFile, "utf8"));
      expect(saved.themeDefaults).toEqual(defaultTokens);
      expect(saved.themeOverrides).toEqual(overrides);
      expect(saved.themeTokens).toEqual({ ...defaultTokens, ...overrides });
      expect(result.shop?.themeTokens).toEqual({ ...defaultTokens, ...overrides });

      const { readShop } = await import("@platform-core/repositories/shops.server");
      const reloaded = await readShop("test");
      expect(reloaded.themeDefaults).toEqual(defaultTokens);
      expect(reloaded.themeOverrides).toEqual(overrides);
      expect(reloaded.themeTokens).toEqual({ ...defaultTokens, ...overrides });
    });
  });
});
