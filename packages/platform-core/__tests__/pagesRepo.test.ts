import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { jest } from "@jest/globals";

// Minimal prisma mock to observe calls
const prisma = {
  page: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../src/db", () => ({ prisma }));

process.env.DATABASE_URL = "postgres://localhost/test";

describe("pages repository with prisma", () => {
  let repo: typeof import("../src/repositories/pages/index.server");

  beforeAll(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pagesrepo-"));
    process.env.DATA_ROOT = path.join(dir, "shops");
    repo = await import("../src/repositories/pages/index.server");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("performs CRUD operations through prisma", async () => {
    const page = {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" } },
      createdAt: "now",
      updatedAt: "now",
      createdBy: "tester",
    } as any;

    prisma.page.findMany.mockResolvedValue([{ data: page }]);

    const pages = await repo.getPages("shop1");
    expect(prisma.page.findMany).toHaveBeenCalledWith({ where: { shopId: "shop1" } });
    expect(pages[0]).toEqual(page);

    prisma.page.upsert.mockResolvedValue({});
    await repo.savePage("shop1", page, undefined);
    expect(prisma.page.upsert).toHaveBeenCalled();

    prisma.page.update.mockResolvedValue({});
    await repo.updatePage("shop1", { id: "1", slug: "start", updatedAt: "now" }, page);
    expect(prisma.page.update).toHaveBeenCalled();

    prisma.page.deleteMany.mockResolvedValue({ count: 1 });
    await repo.deletePage("shop1", "1");
    expect(prisma.page.deleteMany).toHaveBeenCalledWith({ where: { id: "1", shopId: "shop1" } });
  });
});

