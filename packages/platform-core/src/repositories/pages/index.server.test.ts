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

jest.mock("../../db", () => ({ prisma: prismaMock }));

let repo: typeof import("./index.server");
const shop = "demo";

beforeAll(async () => {
  process.env.DATA_ROOT = "/data";
  repo = await import("./index.server");
});

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(fsMock.writeFile).not.toHaveBeenCalled();
  });

  it("falls back to filesystem on prisma failure", async () => {
    prismaMock.page.upsert.mockRejectedValue(new Error("db"));
    prismaMock.page.findMany.mockRejectedValue(new Error("db"));
    fsMock.readFile.mockRejectedValue(new Error("missing"));

    await repo.savePage(shop, page, undefined);

    expect(fsMock.writeFile).toHaveBeenCalled();
    expect(fsMock.rename).toHaveBeenCalled();
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

    await repo.updatePage(
      shop,
      { id: "1", slug: "new", updatedAt: "t" },
      previous,
    );

    expect(prismaMock.page.update).toHaveBeenCalled();
    expect(fsMock.writeFile).not.toHaveBeenCalled();
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
});

describe("deletePage", () => {
  it("throws when page missing in both backends", async () => {
    prismaMock.page.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.page.findMany.mockResolvedValue([]);

    await expect(repo.deletePage(shop, "1")).rejects.toThrow(
      "Page 1 not found",
    );
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
});

