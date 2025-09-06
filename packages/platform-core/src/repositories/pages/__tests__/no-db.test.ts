import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { jest } from "@jest/globals";
import type { Page, HistoryState } from "@acme/types";

const prisma = {
  page: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("../../../db", () => ({ prisma }));

describe("pages repository without database", () => {
  let repo: typeof import("../index.server");
  let root: string;

  beforeAll(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-nodb-"));
    root = path.join(dir, "shops");
    process.env.DATA_ROOT = root;
    delete process.env.DATABASE_URL;
    repo = await import("../index.server");
  });

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(prisma.page.upsert).not.toHaveBeenCalled();

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
    expect(prisma.page.update).not.toHaveBeenCalled();

    await repo.deletePage(shop, page.id);
    pages = await repo.getPages(shop);
    expect(pages).toHaveLength(0);
    expect(prisma.page.deleteMany).not.toHaveBeenCalled();
  });
});
