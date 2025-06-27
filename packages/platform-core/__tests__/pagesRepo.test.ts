import type { Page } from "@types/shared";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (
    repo: typeof import("../repositories/pages"),
    shop: string,
    dir: string
  ) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const repo = await import("../repositories/pages");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("pages repository", () => {
  it("getPages returns empty array when file missing or invalid", async () => {
    await withRepo(async (repo, shop, dir) => {
      expect(await repo.getPages(shop)).toEqual([]);

      await fs.writeFile(
        path.join(dir, "data", "shops", shop, "pages.json"),
        "bad",
        "utf8"
      );

      expect(await repo.getPages(shop)).toEqual([]);
    });
  });

  it("save, update and delete page", async () => {
    await withRepo(async (repo, shop) => {
      const page: Page = {
        id: "1",
        slug: "/test",
        status: "draft",
        components: [],
        seo: { title: "Hello" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "me",
      };

      await repo.savePage(shop, page);

      let pages = await repo.getPages(shop);
      expect(pages).toHaveLength(1);

      const updated = await repo.updatePage(shop, {
        id: "1",
        updatedAt: page.updatedAt,
        status: "published",
      });
      expect(updated.status).toBe("published");

      pages = await repo.getPages(shop);
      expect(pages[0].status).toBe("published");

      await repo.deletePage(shop, "1");
      pages = await repo.getPages(shop);
      expect(pages).toHaveLength(0);

      await expect(repo.deletePage(shop, "missing")).rejects.toThrow();
    });
  });
});
