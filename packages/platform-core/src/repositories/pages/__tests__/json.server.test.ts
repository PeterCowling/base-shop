import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Page, HistoryState } from "@acme/types";

describe("pages.json.server", () => {
  let repo: typeof import("../pages.json.server");
  let root: string;

  beforeAll(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-json-"));
    root = path.join(dir, "shops");
    process.env.DATA_ROOT = root;
    repo = await import("../pages.json.server");
  });

  it("performs CRUD operations using filesystem", async () => {
    const shop = "s1";
    const page: Page = {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" }, description: { en: "" }, image: { en: "" } } as any,
      createdAt: "t",
      updatedAt: "t",
      createdBy: "tester",
    } as Page;

    await repo.savePage(shop, page, undefined);
    let pages = await repo.getPages(shop);
    expect(pages).toHaveLength(1);
    expect(pages[0].createdBy).toBe("tester");

    const history: HistoryState = {
      past: [],
      present: [],
      future: [],
      gridCols: 12,
    } as HistoryState;

    const updated = await repo.updatePage(
      shop,
      { id: page.id, slug: "start", updatedAt: page.updatedAt, history },
      page,
    );
    pages = await repo.getPages(shop);
    expect(updated.slug).toBe("start");
    expect(pages[0].history).toEqual(history);

    await repo.deletePage(shop, page.id);
    pages = await repo.getPages(shop);
    expect(pages).toHaveLength(0);
  });
});
