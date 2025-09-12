import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

jest.setTimeout(15000);

/** Creates a temp repo, runs cb, then restores CWD */
async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pages-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

function mockAuth() {
  jest.doMock("next-auth", () => ({
    getServerSession: jest.fn().mockResolvedValue({
      user: { role: "admin", email: "admin@example.com" },
    }),
  }));
}

describe("page actions", () => {
  afterEach(() => jest.resetAllMocks());

  it("createPage stores new page", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      mockAuth();
      const { createPage } = await import("../src/actions/pages/create");

      const fd = new FormData();
      fd.append("slug", "home");
      fd.append("title", "Home");
      fd.append("description", "Welcome");
      fd.append("components", '[{"id":"c1","type":"HeroBanner"}]');

      const result = await createPage("test", fd);
      expect(result.page?.slug).toBe("home");

      const { getPages } = await import(
        "@acme/platform-core/repositories/pages/index.server"
      );
      const pages = await getPages("test");
      expect(pages).toHaveLength(1);
      expect(pages[0].components[0]).toEqual({ id: "c1", type: "HeroBanner" });
      expect(pages[0].createdBy).toBe("admin@example.com");
    });
  });

  it("updatePage modifies page data", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      mockAuth();
      const repo = await import(
        "@acme/platform-core/repositories/pages/index.server"
      );
      const page = {
        id: "1",
        slug: "home",
        status: "draft",
        components: [],
        seo: { title: { en: "Home" }, description: { en: "" } },
        createdAt: now,
        updatedAt: now,
        createdBy: "tester",
      } as any;
      await repo.savePage("test", page, undefined);

      const { updatePage } = await import("../src/actions/pages/update");
      const fd = new FormData();
      fd.append("id", page.id);
      fd.append("updatedAt", page.updatedAt);
      fd.append("slug", "start");
      fd.append("status", "published");
      fd.append("title", "Start");
      fd.append("description", "desc");
      fd.append("components", "[]");

      const result = await updatePage("test", fd);
      expect(result.page?.slug).toBe("start");
      expect(result.page?.status).toBe("published");

      const pages = await repo.getPages("test");
      expect(pages[0].slug).toBe("start");
    });
  });

  it("updatePage persists history", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      mockAuth();
      const repo = await import(
        "@acme/platform-core/repositories/pages/index.server"
      );
      const page = {
        id: "1",
        slug: "home",
        status: "draft",
        components: [],
        seo: { title: { en: "Home" }, description: { en: "" } },
        createdAt: now,
        updatedAt: now,
        createdBy: "tester",
      } as any;
      await repo.savePage("test", page, undefined);

      const { updatePage } = await import("../src/actions/pages/update");
      const history = {
        past: [],
        present: [{ id: "c1", type: "HeroBanner" }],
        future: [],
        gridCols: 12,
      };
      const fd = new FormData();
      fd.append("id", page.id);
      fd.append("updatedAt", page.updatedAt);
      fd.append("slug", "home");
      fd.append("status", "draft");
      fd.append("title", "Home");
      fd.append("description", "");
      fd.append("components", JSON.stringify(history.present));
      fd.append("history", JSON.stringify(history));

      const result = await updatePage("test", fd);
      expect(result.page?.history).toEqual(history);

      const pages = await repo.getPages("test");
      expect(pages[0].history).toEqual(history);
    });
  });

  it("deletePage removes page from repo", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      mockAuth();
      const repo = await import(
        "@acme/platform-core/repositories/pages/index.server"
      );
      const page = {
        id: "1",
        slug: "remove",
        status: "draft",
        components: [],
        seo: { title: { en: "t" } },
        createdAt: now,
        updatedAt: now,
        createdBy: "tester",
      } as any;
      await repo.savePage("test", page, undefined);

      const { deletePage } = await import("../src/actions/pages/delete");
      await deletePage("test", page.id);

      const pages = await repo.getPages("test");
      expect(pages).toHaveLength(0);
    });
  });

  it("createPage returns validation error for bad components", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      mockAuth();
      const { createPage } = await import("../src/actions/pages/create");
      const fd = new FormData();
      fd.append("slug", "x");
      fd.append("title", "T");
      fd.append("components", "not-json");

      const result = await createPage("test", fd);
      expect(result.errors?.components[0]).toBe("Invalid components");
    });
  });
});
