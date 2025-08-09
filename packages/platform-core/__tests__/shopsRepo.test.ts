// packages/platform-core/__tests__/shopsRepo.test.ts

import type { ShopSettings } from "@types";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (shop: string, dir: string) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  try {
    await cb("test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("shops repository", () => {
  it("returns defaults when settings file missing", async () => {
    await withRepo(async (shop) => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@shared/date", () => ({ nowIso: () => now }));
      const repo = await import("../repositories/settings.server");
      const settings = await repo.getShopSettings(shop);
      expect(settings.languages).toEqual(["en", "de", "it"]);
      const history = await repo.diffHistory(shop);
      expect(history).toEqual([]);
    });
  });

  it("saves settings and records diff history", async () => {
    await withRepo(async (shop, dir) => {
      let current = "2024-01-01T00:00:00.000Z";
      jest.doMock("@shared/date", () => ({ nowIso: () => current }));
      const repo = await import("../repositories/settings.server");
      const first: ShopSettings = {
        languages: ["en", "de"],
        seo: { en: { canonicalBase: "" }, de: { canonicalBase: "" } },
        updatedAt: current,
        updatedBy: "tester",
      };
      await repo.saveShopSettings(shop, first);
      const afterFirst = await repo.getShopSettings(shop);
      expect(afterFirst).toEqual(first);
      let history = await repo.diffHistory(shop);
      expect(history).toHaveLength(1);
      expect(history[0].diff).toEqual(first);

      current = "2024-01-02T00:00:00.000Z";
      const second: ShopSettings = {
        languages: ["en"],
        seo: { en: { canonicalBase: "" } },
        updatedAt: current,
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
