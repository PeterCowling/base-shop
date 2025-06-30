// packages/platform-core/__tests__/shopsRepo.test.ts

import type { ShopSettings } from "@types";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (
    repo: typeof import("../repositories/shops.server"),
    shop: string,
    dir: string
  ) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const repo = await import("../repositories/shops.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("shops repository", () => {
  it("returns defaults when settings file missing", async () => {
    await withRepo(async (repo, shop) => {
      const settings = await repo.getShopSettings(shop);
      expect(settings.languages).toEqual(["en", "de", "it"]);
      const history = await repo.diffHistory(shop);
      expect(history).toEqual([]);
    });
  });

  it("saves settings and records diff history", async () => {
    await withRepo(async (repo, shop, dir) => {
      const now = new Date().toISOString();
      const first: ShopSettings = {
        languages: ["en", "de"],
        seo: { en: { canonicalBase: "" }, de: { canonicalBase: "" } },
        updatedAt: now,
        updatedBy: "tester",
      };
      await repo.saveShopSettings(shop, first);
      const afterFirst = await repo.getShopSettings(shop);
      expect(afterFirst).toEqual(first);
      let history = await repo.diffHistory(shop);
      expect(history).toHaveLength(1);
      expect(history[0].diff).toEqual(first);

      const second: ShopSettings = {
        languages: ["en"],
        seo: { en: { canonicalBase: "" } },
        updatedAt: new Date().toISOString(),
        updatedBy: "tester",
      };
      await repo.saveShopSettings(shop, second);
      const afterSecond = await repo.getShopSettings(shop);
      expect(afterSecond).toEqual(second);
      history = await repo.diffHistory(shop);
      expect(history).toHaveLength(2);

      const file = path.join(
        dir,
        "data",
        "shops",
        shop,
        "settings.history.jsonl"
      );
      const buf = await fs.readFile(file, "utf8");
      expect(buf.trim().split(/\n+/)).toHaveLength(2);
    });
  });
});
