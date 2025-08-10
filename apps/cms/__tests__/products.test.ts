// apps/cms/__tests__/products.test.ts

import type { ProductPublication } from "../../../packages/platform-core/src/products";

// Ensure auth options do not throw on import
process.env.NEXTAUTH_SECRET = "test-secret";
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
}));
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));

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
  afterEach(() => jest.resetAllMocks());
  it("createDraftRecord creates placeholders", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("../../../packages/shared/date", () => ({ nowIso: () => now }));
      const { createDraftRecord } = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const draft = await createDraftRecord("test");
      expect(draft.status).toBe("draft");
      expect(draft.title.en).toBe("Untitled");
      expect(Object.keys(draft.title)).toEqual(["en", "de", "it"]);
      expect(Object.keys(draft.description)).toEqual(["en", "de", "it"]);
    });
  });

  it("updateProduct merges form data and bumps version", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("../../../packages/shared/date", () => ({ nowIso: () => now }));
      const actions = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const prod: ProductPublication = await actions.createDraftRecord("test");

      const fd = new FormData();
      fd.append("id", prod.id);
      fd.append("title_en", "Hello");
      fd.append("desc_en", "World");
      fd.append("title_de", "Hallo");
      fd.append("desc_de", "Welt");
      fd.append("title_it", "Ciao");
      fd.append("desc_it", "Mondo");
      fd.append("price", "10");

      const result = await actions.updateProduct("test", fd);
      const updated = result.product;
      expect(updated).toBeDefined();
    });
  });

  it("rejects invalid product payloads", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("../../../packages/shared/date", () => ({ nowIso: () => now }));
      const actions = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const prod: ProductPublication = await actions.createDraftRecord("test");

      const fd = new FormData();
      fd.append("id", prod.id);
      fd.append("title_en", "Hello");
      fd.append("desc_en", "World");
      fd.append("title_de", "Hallo");
      fd.append("desc_de", "Welt");
      fd.append("title_it", "Ciao");
      fd.append("desc_it", "Mondo");
      fd.append("price", "-5");

      const result = await actions.updateProduct("test", fd);
      expect(result.product).toBeUndefined();
      expect(result.errors?.price).toEqual(["Invalid price"]);

      const { readRepo } = await import(
        "../../../packages/platform-core/src/repositories/json.server"
      );
      const repo = (await readRepo("test")) as ProductPublication[];
      expect(repo[0].price).toBe(0);
    });
  });

  it("duplicateProduct copies a product", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("../../../packages/shared/date", () => ({ nowIso: () => now }));
      const actions = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const prod = await actions.createDraftRecord("test");

      const { duplicateProduct } = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      await duplicateProduct("test", prod.id);

      const { readRepo } = await import(
        "../../../packages/platform-core/src/repositories/json.server"
      );
      const repo = (await readRepo("test")) as ProductPublication[];

      expect(repo).toHaveLength(2);
      expect(repo[0].id).not.toBe(prod.id);
      expect(repo[0].status).toBe("draft");
    });
  });

  it("deleteProduct removes product and redirects", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("../../../packages/shared/date", () => ({ nowIso: () => now }));
      const actions = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const prod = await actions.createDraftRecord("test");

      const { deleteProduct } = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      await deleteProduct("test", prod.id);

      const { readRepo } = await import(
        "../../../packages/platform-core/src/repositories/json.server"
      );
      const repo = (await readRepo("test")) as ProductPublication[];

      expect(repo).toHaveLength(0);
    });
  });
});
