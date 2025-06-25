// apps/cms/__tests__/products.test.ts
import { jest } from "@jest/globals";
import type { ProductPublication } from "@platform-core/products";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Creates a fresh repo in a tmp dir, runs `cb`, then restores CWD. */
async function withRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "repo-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules(); // ensure each test gets a fresh module graph
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

describe("product actions", () => {
  it("createDraftRecord creates placeholders", async () => {
    await withRepo(async () => {
      const { createDraftRecord } = (await import(
        "../src/actions/products"
      )) as typeof import("../src/actions/products");

      const draft = await createDraftRecord("test");
      expect(draft.status).toBe("draft");
      expect(draft.title.en).toBe("Untitled");
      expect(Object.keys(draft.title)).toEqual(["en", "de", "it"]);
    });
  });

  it("updateProduct merges form data and bumps version", async () => {
    await withRepo(async () => {
      const actions = (await import(
        "../src/actions/products"
      )) as typeof import("../src/actions/products");

      const prod: ProductPublication = await actions.createDraftRecord("test");

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
      const actions = (await import(
        "../src/actions/products"
      )) as typeof import("../src/actions/products");

      const prod = await actions.createDraftRecord("test");

      const mockRedirect = jest.fn();
      jest.doMock("next/navigation", () => ({ redirect: mockRedirect }));

      const { duplicateProduct } = (await import(
        "../src/actions/products"
      )) as typeof import("../src/actions/products");

      await duplicateProduct("test", prod.id);

      const { readRepo } = await import("@platform-core/repositories/json");
      const repo = (await readRepo("test")) as ProductPublication[];

      expect(repo).toHaveLength(2);
      expect(repo[0].id).not.toBe(prod.id);
      expect(repo[0].status).toBe("draft");
      expect(mockRedirect).toHaveBeenCalled();
    });
  });

  it("deleteProduct removes product and redirects", async () => {
    await withRepo(async () => {
      const actions = (await import(
        "../src/actions/products"
      )) as typeof import("../src/actions/products");

      const prod = await actions.createDraftRecord("test");

      const mockRedirect = jest.fn();
      jest.doMock("next/navigation", () => ({ redirect: mockRedirect }));

      const { deleteProduct } = (await import(
        "../src/actions/products"
      )) as typeof import("../src/actions/products");

      await deleteProduct("test", prod.id);

      const { readRepo } = await import("@platform-core/repositories/json");
      const repo = (await readRepo("test")) as ProductPublication[];

      expect(repo).toHaveLength(0);
      expect(mockRedirect).toHaveBeenCalled();
    });
  });
});
