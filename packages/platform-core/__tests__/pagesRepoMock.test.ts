import path from "node:path";
import { jest } from "@jest/globals";
import type { Page } from "@acme/types";

// In-memory file system mock
const files = new Map<string, string>();
const fsMock = {
  readFile: jest.fn(async (p: string) => {
    const data = files.get(p);
    if (data === undefined) throw new Error("ENOENT");
    return data;
  }),
  writeFile: jest.fn(async (p: string, data: string) => {
    files.set(p, data as string);
  }),
  appendFile: jest.fn(async (p: string, data: string) => {
    const prev = files.get(p) ?? "";
    files.set(p, prev + (data as string));
  }),
  mkdir: jest.fn(async () => {}),
  rename: jest.fn(async (tmp: string, dest: string) => {
    const data = files.get(tmp);
    if (data !== undefined) {
      files.set(dest, data);
      files.delete(tmp);
    }
  }),
};

jest.mock("fs", () => ({ promises: fsMock }));

// Prisma mock
const prisma = {
  page: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../src/db", () => ({ prisma }));

process.env.DATA_ROOT = "/data";
process.env.DATABASE_URL = "postgres://localhost/test";

let repo: typeof import("../src/repositories/pages/index.server");
const shop = "mockshop";
const samplePage: Page = {
  id: "1",
  slug: "home",
  status: "draft",
  components: [],
  seo: { title: { en: "Home" }, description: { en: "" }, image: { en: "" } } as any,
  createdAt: "t",
  updatedAt: "t",
  createdBy: "tester",
} as Page;

beforeAll(async () => {
  repo = await import("../src/repositories/pages/index.server");
});

let consoleErrorSpy: { mockRestore: () => void };

beforeEach(() => {
  files.clear();
  jest.clearAllMocks();
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("pages repository core logic", () => {
  it("getPages returns rows from prisma", async () => {
    prisma.page.findMany.mockResolvedValueOnce([{ data: samplePage }]);
    const pages = await repo.getPages(shop);
    expect(pages).toEqual([samplePage]);
  });

  it("getPages falls back to filesystem when prisma fails", async () => {
    prisma.page.findMany.mockRejectedValueOnce(new Error("db"));
    const filePath = path.join(process.env.DATA_ROOT!, shop, "pages.json");
    files.set(filePath, JSON.stringify([samplePage]));
    const pages = await repo.getPages(shop);
    expect(pages).toEqual([samplePage]);
  });

  it("getPages returns [] when prisma fails and file missing", async () => {
    prisma.page.findMany.mockRejectedValueOnce(new Error("db"));
    const pages = await repo.getPages(shop);
    expect(pages).toEqual([]);
  });

  it("savePage writes to filesystem on prisma error", async () => {
    prisma.page.upsert.mockRejectedValue(new Error("db"));
    prisma.page.findMany.mockRejectedValue(new Error("db"));
    await repo.savePage(shop, samplePage, undefined);
    const filePath = path.join(process.env.DATA_ROOT!, shop, "pages.json");
    expect(JSON.parse(files.get(filePath)!)).toEqual([samplePage]);
  });

  it("savePage updates existing page via writePages when prisma fails", async () => {
    prisma.page.upsert.mockRejectedValue(new Error("db"));
    prisma.page.findMany.mockRejectedValue(new Error("db"));
    const filePath = path.join(process.env.DATA_ROOT!, shop, "pages.json");
    files.set(filePath, JSON.stringify([{ ...samplePage, slug: "old" }]));
    const updated = { ...samplePage, slug: "new" };
    await repo.savePage(shop, updated, undefined);
    expect(fsMock.writeFile).toHaveBeenCalled();
    expect(JSON.parse(files.get(filePath)!)).toEqual([updated]);
  });

  it("deletePage throws when page not found", async () => {
    prisma.page.deleteMany.mockResolvedValueOnce({ count: 0 });
    prisma.page.findMany.mockRejectedValueOnce(new Error("db"));
    await expect(repo.deletePage(shop, "nope")).rejects.toThrow(
      "Page nope not found in"
    );
    expect(fsMock.writeFile).not.toHaveBeenCalled();
  });

  it("updatePage detects conflicts", async () => {
    const previous = { ...samplePage };
    const patch = { id: samplePage.id, slug: "b", updatedAt: "new" };
    await expect(repo.updatePage(shop, patch, previous)).rejects.toThrow(
      "Conflict"
    );
  });

  it("updatePage falls back to filesystem when prisma fails", async () => {
    prisma.page.update.mockRejectedValue(new Error("db"));
    prisma.page.findMany.mockRejectedValue(new Error("db"));
    const filePath = path.join(process.env.DATA_ROOT!, shop, "pages.json");
    files.set(filePath, JSON.stringify([samplePage]));
    const result = await repo.updatePage(
      shop,
      { id: samplePage.id, slug: "b", updatedAt: samplePage.updatedAt },
      samplePage
    );
    const stored = JSON.parse(files.get(filePath)!)[0];
    expect(stored.slug).toBe("b");
    expect(result.slug).toBe("b");
  });

  it("updatePage throws when prisma fails and page missing", async () => {
    prisma.page.update.mockRejectedValue(new Error("db"));
    prisma.page.findMany.mockRejectedValue(new Error("db"));
    const previous = { ...samplePage, id: "missing" };
    const patch = {
      id: "missing",
      slug: "b",
      updatedAt: previous.updatedAt,
    };
    await expect(repo.updatePage(shop, patch, previous)).rejects.toThrow(
      "Page missing not found in"
    );
  });

  it("diffHistory filters malformed lines", async () => {
    const historyPath = path.join(
      process.env.DATA_ROOT!,
      shop,
      "pages.history.jsonl"
    );
    const good1 = JSON.stringify({
      timestamp: "2020-01-01T00:00:00.000Z",
      diff: { slug: "a" },
    });
    const badJson = "{not json}";
    const badSchema = JSON.stringify({
      timestamp: "2020-01-01T00:00:00.000Z",
      diff: "oops",
    });
    const good2 = JSON.stringify({
      timestamp: "2020-01-02T00:00:00.000Z",
      diff: { slug: "b" },
    });
    files.set(historyPath, [good1, badJson, badSchema, good2].join("\n"));
    const history = await repo.diffHistory(shop);
    expect(history).toHaveLength(2);
    expect(history[0].diff.slug).toBe("a");
    expect(history[1].diff.slug).toBe("b");
  });

  it("diffHistory returns empty array when read fails", async () => {
    fsMock.readFile.mockRejectedValueOnce(new Error("fs"));
    const history = await repo.diffHistory(shop);
    expect(history).toEqual([]);
  });
});

