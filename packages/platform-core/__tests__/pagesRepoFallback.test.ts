import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { jest } from "@jest/globals";

import type { Page } from "@acme/types";

// Prisma mock with adjustable behaviors
const prisma = {
  page: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../src/db", () => ({ prisma }));

describe("pages repository filesystem fallbacks", () => {
  let repo: typeof import("../src/repositories/pages/index.server");
  let root: string;

  beforeAll(async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pagesrepo-"));
    root = path.join(dir, "shops");
    await fs.mkdir(root, { recursive: true });
    process.env.DATA_ROOT = root;
    process.env.DATABASE_URL = "postgres://localhost/test";
    repo = await import("../src/repositories/pages/index.server");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("falls back to filesystem when prisma fails and returns raw JSON for invalid schema", async () => {
    const shop = "fsfail";
    const shopDir = path.join(root, shop);
    await fs.mkdir(shopDir, { recursive: true });
    const invalid = [{ bad: true }];
    await fs.writeFile(path.join(shopDir, "pages.json"), JSON.stringify(invalid), "utf8");

    prisma.page.findMany.mockRejectedValue(new Error("db"));

    const pages = await repo.getPages(shop);
    expect(pages).toEqual(invalid);
    expect(prisma.page.findMany).toHaveBeenCalled();
  });

  it("writes to filesystem when prisma.upsert fails in savePage", async () => {
    const shop = "savefallback";
    const page: Page = {
      id: "1",
      slug: "home",
      status: "draft",
      components: [],
      seo: { title: "Home" },
      createdAt: "t",
      updatedAt: "t",
      createdBy: "tester",
    } as Page;

    prisma.page.upsert.mockRejectedValue(new Error("db"));
    prisma.page.findMany.mockRejectedValue(new Error("db"));

    await repo.savePage(shop, page, undefined);

    const buf = await fs.readFile(path.join(root, shop, "pages.json"), "utf8");
    expect(JSON.parse(buf)).toEqual([page]);

    const history = await fs.readFile(
      path.join(root, shop, "pages.history.jsonl"),
      "utf8"
    );
    const entry = JSON.parse(history.trim());
    expect(entry.diff).toEqual(page);
  });

  it("deletePage throws when page not found", async () => {
    const shop = "delete-miss";
    const shopDir = path.join(root, shop);
    await fs.mkdir(shopDir, { recursive: true });
    await fs.writeFile(path.join(shopDir, "pages.json"), JSON.stringify([]), "utf8");

    prisma.page.deleteMany.mockResolvedValue({ count: 0 });
    prisma.page.findMany.mockRejectedValue(new Error("db"));

    await expect(repo.deletePage(shop, "nope")).rejects.toThrow(
      "Page nope not found in"
    );
  });

  it("updatePage detects conflicts", async () => {
    const previous = {
      id: "1",
      slug: "a",
      status: "draft",
      components: [],
      seo: { title: "t" },
      createdAt: "t",
      updatedAt: "old",
      createdBy: "me",
    } as Page;
    const patch = { id: "1", slug: "b", updatedAt: "new" };

    await expect(repo.updatePage("conflict", patch, previous)).rejects.toThrow(
      "Conflict"
    );
  });

  it("falls back to filesystem update when prisma fails", async () => {
    const shop = "update-fs";
    const shopDir = path.join(root, shop);
    await fs.mkdir(shopDir, { recursive: true });
    const page: Page = {
      id: "1",
      slug: "a",
      status: "draft",
      components: [],
      seo: { title: "t" },
      createdAt: "t",
      updatedAt: "t",
      createdBy: "me",
    } as Page;
    await fs.writeFile(
      path.join(shopDir, "pages.json"),
      JSON.stringify([page]),
      "utf8"
    );

    prisma.page.update.mockRejectedValue(new Error("db"));
    prisma.page.findMany.mockRejectedValue(new Error("db"));

    const result = await repo.updatePage(
      shop,
      { id: "1", slug: "b", updatedAt: "t" },
      page
    );
    const buf = await fs.readFile(path.join(shopDir, "pages.json"), "utf8");
    const stored = JSON.parse(buf)[0];
    expect(stored.slug).toBe("b");
    expect(result.slug).toBe("b");

    const history = await fs.readFile(
      path.join(shopDir, "pages.history.jsonl"),
      "utf8"
    );
    const diff = JSON.parse(history.trim()).diff;
    expect(diff.slug).toBe("b");
    expect(diff.updatedAt).toBeDefined();
  });
});
