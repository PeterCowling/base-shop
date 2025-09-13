import { jest } from "@jest/globals";
import type { Page } from "@acme/types";

const fsMock = {
  appendFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn(),
};

jest.mock("fs", () => ({ promises: fsMock }));

const prismaMock = {
  page: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("../../../db", () => ({ prisma: prismaMock }));

describe("pages.prisma.server", () => {
  let repo: typeof import("../pages.prisma.server");
  const shop = "demo";

  beforeAll(async () => {
    process.env.DATA_ROOT = "/data";
    repo = await import("../pages.prisma.server");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns rows from prisma", async () => {
    const page: Page = {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" } },
      createdAt: "t",
      updatedAt: "t",
      createdBy: "me",
    } as Page;
    prismaMock.page.findMany.mockResolvedValue([{ data: page }]);
    const res = await repo.getPages(shop);
    expect(res).toEqual([page]);
    expect(prismaMock.page.findMany).toHaveBeenCalled();
    expect(fsMock.readFile).not.toHaveBeenCalled();
  });

  it("saves via prisma and records history", async () => {
    const page: Page = {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" } },
      createdAt: "t",
      updatedAt: "t",
      createdBy: "me",
    } as Page;
    prismaMock.page.upsert.mockResolvedValue({});
    await repo.savePage(shop, page, undefined);
    expect(prismaMock.page.upsert).toHaveBeenCalled();
    expect(fsMock.appendFile).toHaveBeenCalledTimes(1);
    await repo.savePage(shop, { ...page, slug: "new" }, page);
    expect(fsMock.appendFile).toHaveBeenCalledTimes(2);
  });

  it("updates via prisma and records history", async () => {
    const previous: Page = {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" } },
      createdAt: "t",
      updatedAt: "t",
      createdBy: "me",
    } as Page;
    prismaMock.page.update.mockResolvedValue({});
    await repo.updatePage(
      shop,
      { id: "1", slug: "new", updatedAt: "t" },
      previous,
    );
    expect(prismaMock.page.update).toHaveBeenCalled();
    expect(fsMock.appendFile).toHaveBeenCalled();
  });

  it("throws on update conflict", async () => {
    const previous: Page = {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: { en: "Home" } },
      createdAt: "t",
      updatedAt: "t",
      createdBy: "me",
    } as Page;
    await expect(
      repo.updatePage(shop, { id: "1", updatedAt: "other" }, previous),
    ).rejects.toThrow("Conflict");
  });

  it("throws when deleting missing page", async () => {
    prismaMock.page.deleteMany.mockResolvedValue({ count: 0 });
    await expect(repo.deletePage(shop, "1")).rejects.toThrow(
      "Page 1 not found",
    );
  });

  it("parses diff history", async () => {
    const entry = {
      timestamp: "2024-01-01T00:00:00.000Z",
      diff: { slug: "a" },
    };
    fsMock.readFile.mockResolvedValue(`${JSON.stringify(entry)}\n`);
    const res = await repo.diffHistory(shop);
    expect(res).toEqual([entry]);
  });
});
