import { jest } from "@jest/globals";
import type { Page } from "@acme/types";

const fsMock = {
  readFile: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined),
  rename: jest.fn().mockResolvedValue(undefined),
  appendFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined),
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

let repo: typeof import("../index.server");
const shop = "demo";

beforeAll(async () => {
  process.env.DATA_ROOT = "/data";
  process.env.DATABASE_URL = "postgres://localhost/test";
  repo = await import("../index.server");
});

beforeEach(() => {
  jest.resetAllMocks();
});

describe("getPages", () => {
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

  it("returns rows from prisma when available", async () => {
    prismaMock.page.findMany.mockResolvedValue([{ data: page }]);

    const res = await repo.getPages(shop);
    expect(res).toEqual([page]);
    expect(prismaMock.page.findMany).toHaveBeenCalled();
    expect(fsMock.readFile).not.toHaveBeenCalled();
  });

  it("falls back to filesystem when prisma fails", async () => {
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    fsMock.readFile.mockResolvedValue(JSON.stringify([page]));

    const res = await repo.getPages(shop);
    expect(res).toEqual([page]);
    expect(fsMock.readFile).toHaveBeenCalled();
  });

  it("returns empty array when both sources have no pages", async () => {
    prismaMock.page.findMany.mockResolvedValue([]);
    const res = await repo.getPages(shop);
    expect(res).toEqual([]);
  });

  it("returns raw JSON when filesystem data fails schema", async () => {
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    const raw = [{ bad: "data" }];
    fsMock.readFile.mockResolvedValue(JSON.stringify(raw));
    const res = await repo.getPages(shop);
    expect(res).toEqual(raw);
  });

  it("returns empty array when filesystem has invalid JSON", async () => {
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    fsMock.readFile.mockResolvedValue("{bad");
    const res = await repo.getPages(shop);
    expect(res).toEqual([]);
  });
});

describe("savePage", () => {
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

  it("writes via prisma", async () => {
    prismaMock.page.upsert.mockResolvedValue({});

    await repo.savePage(shop, page, undefined);

    expect(prismaMock.page.upsert).toHaveBeenCalled();
    expect(fsMock.writeFile).toHaveBeenCalled();
  });

  it("falls back to filesystem on prisma failure", async () => {
    prismaMock.page.upsert.mockRejectedValue(new Error("db"));
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    fsMock.readFile.mockRejectedValue(new Error("missing"));

    await repo.savePage(shop, page, undefined);

    expect(fsMock.writeFile).toHaveBeenCalled();
    expect(fsMock.rename).toHaveBeenCalled();
  });

  it("appends history when page changes", async () => {
    prismaMock.page.upsert.mockResolvedValue({});
    const prev = { ...page, slug: "old" } as Page;
    await repo.savePage(shop, page, prev);
    expect(fsMock.appendFile).toHaveBeenCalled();
  });
});

describe("updatePage", () => {
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

  it("writes via prisma", async () => {
    prismaMock.page.update.mockResolvedValue({});
    fsMock.readFile.mockResolvedValue(JSON.stringify([previous]));

    await repo.updatePage(
      shop,
      { id: "1", slug: "new", updatedAt: "t" },
      previous,
    );

    expect(prismaMock.page.update).toHaveBeenCalled();
    expect(fsMock.writeFile).toHaveBeenCalled();
  });

  it("falls back to filesystem on prisma failure", async () => {
    prismaMock.page.update.mockRejectedValue(new Error("db"));
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    fsMock.readFile.mockResolvedValue(JSON.stringify([previous]));

    await repo.updatePage(
      shop,
      { id: "1", slug: "new", updatedAt: "t" },
      previous,
    );

    expect(fsMock.writeFile).toHaveBeenCalled();
  });

  it("throws on update conflict", async () => {
    await expect(
      repo.updatePage(shop, { id: "1", updatedAt: "other" }, previous)
    ).rejects.toThrow("Conflict");
  });

  it("throws when page missing in filesystem fallback", async () => {
    prismaMock.page.update.mockRejectedValue(new Error("db"));
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    fsMock.readFile.mockResolvedValue(JSON.stringify([]));
    await expect(
      repo.updatePage(shop, { id: "missing", updatedAt: "t" }, previous)
    ).rejects.toThrow("Page missing");
  });
});

describe("deletePage", () => {
  it("throws when page missing in both backends", async () => {
    prismaMock.page.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.page.findMany.mockResolvedValue([]);

    await expect(repo.deletePage(shop, "1")).rejects.toThrow(
      "Page 1 not found",
    );
  });

  it("deletes via prisma when record exists", async () => {
    prismaMock.page.deleteMany.mockResolvedValue({ count: 1 });
    fsMock.readFile.mockResolvedValue(JSON.stringify([{ id: "1" }]));
    await expect(repo.deletePage(shop, "1")).resolves.toBeUndefined();
    expect(fsMock.writeFile).toHaveBeenCalled();
  });

  it("falls back to filesystem when prisma fails", async () => {
    prismaMock.page.deleteMany.mockRejectedValue(new Error("db"));
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    fsMock.readFile.mockResolvedValue(JSON.stringify([{ id: "1" }]));
    await repo.deletePage(shop, "1");
    expect(fsMock.writeFile).toHaveBeenCalled();
  });
});

describe("diffHistory", () => {
  it("parses valid lines and skips malformed entries", async () => {
    const valid1 = {
      timestamp: "2024-01-01T00:00:00.000Z",
      diff: { slug: "a" },
    };
    const valid2 = {
      timestamp: "2024-01-02T00:00:00.000Z",
      diff: { slug: "b" },
    };
    const malformed = "not-json";
    const invalid = JSON.stringify({ timestamp: "bad", diff: { slug: "x" } });
    fsMock.readFile.mockResolvedValue(
      `${JSON.stringify(valid1)}\n${malformed}\n${invalid}\n${JSON.stringify(valid2)}\n`,
    );

    const res = await repo.diffHistory(shop);
    expect(res).toEqual([valid1, valid2]);
  });

  it("returns empty array when history file missing", async () => {
    fsMock.readFile.mockRejectedValue(new Error("missing"));
    const res = await repo.diffHistory(shop);
    expect(res).toEqual([]);
  });
});

