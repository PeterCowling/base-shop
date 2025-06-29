// apps/cms/__tests__/products.test.ts

import type { ProductPublication } from "@platform-core/products";

// Ensure auth options do not throw on import
process.env.NEXTAUTH_SECRET = "test-secret";
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));

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

describe.skip("product actions", () => {
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

  it("createDraftRecord populates locales from settings", async () => {
    await withRepo(async () => {
      const { writeSettings } = await import(
        "@platform-core/repositories/json"
      );
      // Custom locales for this shop
      await writeSettings("test", {
        languages: ["es", "fr"],
      } as unknown as import("@types").ShopSettings);
      const { createDraftRecord } = (await import(
        "../src/actions/products"
      )) as typeof import("../src/actions/products");
      const draft = (await createDraftRecord("test")) as any;
      expect(Object.keys(draft.title)).toEqual(["es", "fr"]);
      expect(draft.title.es).toBe("Untitled");
      expect(draft.description.es).toBe("");
      expect(draft.description.fr).toBe("");
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

      const result = await actions.updateProduct("test", fd);
      const updated = result.product!;
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
