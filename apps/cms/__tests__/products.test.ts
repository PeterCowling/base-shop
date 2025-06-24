const fs = require("node:fs").promises;
const os = require("node:os");
const path = require("node:path");

async function withRepo(cb) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "repo-"));
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

describe("product actions", () => {
  it("createDraftRecord creates placeholders", async () => {
    await withRepo(async () => {
      const { createDraftRecord } = require(
        path.join(__dirname, "../src/actions/products.ts")
      );
      const draft = await createDraftRecord("test");
      expect(draft.status).toBe("draft");
      expect(draft.title.en).toBe("Untitled");
      expect(Object.keys(draft.title)).toEqual(["en", "de", "it"]);
    });
  });

  it("updateProduct merges form data and bumps version", async () => {
    await withRepo(async () => {
      const actions = require(
        path.join(__dirname, "../src/actions/products.ts")
      );
      const prod = await actions.createDraftRecord("test");
      const fd = new FormData();
      fd.append("id", prod.id);
      fd.append("title_en", "Hello");
      fd.append("desc_en", "World");
      fd.append("price", "10");
      const updated = await actions.updateProduct("test", fd);
      expect(updated.title.en).toBe("Hello");
      expect(updated.description.en).toBe("World");
      expect(updated.row_version).toBe(prod.row_version + 1);
    });
  });

  it("duplicateProduct copies a product", async () => {
    await withRepo(async () => {
      const actions = require(
        path.join(__dirname, "../src/actions/products.ts")
      );
      const prod = await actions.createDraftRecord("test");
      const mockRedirect = jest.fn();
      jest.doMock("next/navigation", () => ({ redirect: mockRedirect }));
      const { duplicateProduct } = require(
        path.join(__dirname, "../src/actions/products.ts")
      );
      await duplicateProduct("test", prod.id);
      expect(mockRedirect).toHaveBeenCalled();
      const repo = await require("@platform-core/repositories/json").readRepo(
        "test"
      );
      expect(repo).toHaveLength(2);
      expect(repo[0].id).not.toBe(prod.id);
      expect(repo[0].status).toBe("draft");
    });
  });

  it("deleteProduct removes product and redirects", async () => {
    await withRepo(async () => {
      const actions = require(
        path.join(__dirname, "../src/actions/products.ts")
      );
      const prod = await actions.createDraftRecord("test");
      const mockRedirect = jest.fn();
      jest.doMock("next/navigation", () => ({ redirect: mockRedirect }));
      const { deleteProduct } = require(
        path.join(__dirname, "../src/actions/products.ts")
      );
      await deleteProduct("test", prod.id);
      const repo = await require("@platform-core/repositories/json").readRepo(
        "test"
      );
      expect(repo).toHaveLength(0);
      expect(mockRedirect).toHaveBeenCalled();
    });
  });
});
