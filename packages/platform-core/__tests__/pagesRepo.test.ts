// packages/platform-core/__tests__/pagesRepo.test.ts
import type { Page } from "@types";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

/** The shape of the pages repository module we import dynamically */
type PagesRepo = typeof import("../repositories/pages/index.server");

async function withRepo(
  cb: (shop: string, dir: string) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-"));
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

describe("pages repository", () => {
  it("getPages returns empty array when file missing or invalid", async () => {
    await withRepo(async (shop, dir) => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("../../shared/date", () => ({ nowIso: () => now }));
      const repo: PagesRepo = await import("../repositories/pages/index.server");
      expect(await repo.getPages(shop)).toEqual([]);
      await fs.writeFile(
        path.join(dir, "data", "shops", shop, "pages.json"),
        "bad",
        "utf8"
      );
      expect(await repo.getPages(shop)).toEqual([]);
    });
  });

  it("save, update and delete handle success and errors", async () => {
    await withRepo(async (shop) => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("../../shared/date", () => ({ nowIso: () => now }));
      const repo: PagesRepo = await import("../repositories/pages/index.server");
      const page: Page = {
        id: "1",
        slug: "home",
        status: "draft",
        components: [],
        seo: { title: "Home" },
        createdAt: now,
        updatedAt: now,
        createdBy: "tester",
      };
      await repo.savePage(shop, page);

      const pages = await repo.getPages(shop);
      expect(pages).toHaveLength(1);

      const updated = await repo.updatePage(shop, {
        id: "1",
        updatedAt: page.updatedAt,
        slug: "start",
      });
      expect(updated.slug).toBe("start");
      await expect(
        repo.updatePage(shop, { id: "x", updatedAt: page.updatedAt })
      ).rejects.toThrow();

      await expect(
        repo.updatePage(shop, { id: "1", updatedAt: "old" })
      ).rejects.toThrow();

      await repo.deletePage(shop, "1");
      expect(await repo.getPages(shop)).toHaveLength(0);
      await expect(repo.deletePage(shop, "missing")).rejects.toThrow();
    });
  });
});
