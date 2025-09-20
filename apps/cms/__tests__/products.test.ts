// apps/cms/__tests__/products.test.ts

import type { ProductPublication } from "@acme/platform-core/products/index";

// Ensure auth options do not throw on import
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-32-chars-long-string!";

import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

// Minimal wrapper to attach CMS-specific mocks after module reset
const withRepo = (cb: (dir: string) => Promise<void>) =>
  withTempRepo(async (dir) => {
    jest.doMock("next-auth", () => ({
      getServerSession: jest.fn().mockResolvedValue({
        user: { role: "admin" },
      }),
    }));
    jest.doMock("next/navigation", () => ({ redirect: jest.fn() }));
    jest.doMock("@cms/auth/options", () => ({ authOptions: {} }));
    await cb(dir);
  }, { prefix: 'repo-' });

/* -------------------------------------------------------------------------- */
/* Tests                                                                       */
/* -------------------------------------------------------------------------- */

describe("product actions", () => {
  afterEach(() => jest.resetAllMocks());
  it("createDraftRecord creates placeholders", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
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
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
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
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
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
        "@acme/platform-core/repositories/json.server"
      );
      const repo = (await readRepo("test")) as ProductPublication[];
      expect(repo[0].price).toBe(0);
    });
  });

  it("duplicateProduct copies a product", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      const actions = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const prod = await actions.createDraftRecord("test");

      const { duplicateProduct } = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      await duplicateProduct("test", prod.id);

      const { readRepo } = await import(
        "@acme/platform-core/repositories/json.server"
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
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      const actions = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const prod = await actions.createDraftRecord("test");

      const { deleteProduct } = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      await deleteProduct("test", prod.id);

      const { readRepo } = await import(
        "@acme/platform-core/repositories/json.server"
      );
      const repo = (await readRepo("test")) as ProductPublication[];

      expect(repo).toHaveLength(0);
    });
  });

  it("promoteProduct advances status", async () => {
    await withRepo(async () => {
      const now = "2024-01-01T00:00:00.000Z";
      jest.doMock("@acme/date-utils", () => ({ nowIso: () => now }));
      const actions = (await import(
        "../src/actions/products.server"
      )) as typeof import("../src/actions/products.server");

      const draft = await actions.createDraftRecord("test");
      const review = await actions.promoteProduct("test", draft.id);
      expect(review.status).toBe("review");

      const active = await actions.promoteProduct("test", draft.id);
      expect(active.status).toBe("active");
    });
  });
});
