// packages/platform-core/__tests__/repositories.test.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import type { ProductPublication } from "../src/products/index";
import { nowIso } from "@date-utils";
import { withTempRepo } from "@acme/test-utils";

// These integration-style tests touch the filesystem and can occasionally be
// slow on CI machines, so allow a more generous timeout than Jest's default
// 5 seconds.
jest.setTimeout(20_000);

/** The shape of the JSON-repository module we import dynamically */
type JsonRepo = typeof import("../src/repositories/json.server");

/**
 * Creates an isolated temp repo, runs `cb`, then restores CWD.
 * Everything stays strongly-typed – no `any`.
 */
const withRepo = (
  cb: (repo: JsonRepo, shop: string, dir: string) => Promise<void>
) =>
  withTempRepo(async (dir) => {
    const repo: JsonRepo = await import("../src/repositories/json.server");
    await cb(repo, "test", dir);
  }, { prefix: 'repo-' });

/* -------------------------------------------------------------------------- */
/* Tests                                                                      */
/* -------------------------------------------------------------------------- */

describe("json repository", () => {
  it("readRepo returns empty array when file missing or invalid", async () => {
    await withRepo(async (repo, shop, dir) => {
      expect(await repo.readRepo(shop)).toEqual([]);

      await fs.writeFile(
        path.join(dir, "data", "shops", shop, "products.json"),
        "bad",
        "utf8"
      );

      expect(await repo.readRepo(shop)).toEqual([]);
    });
  });

  it("update, delete and duplicate handle success and errors", async () => {
    await withRepo(async (repo, shop) => {
      const product: ProductPublication = {
        id: "1",
        sku: "sku-1",
        title: { en: "t", de: "t", it: "t" },
        description: { en: "", de: "", it: "" },
        price: 10,
        currency: "EUR",
        media: [],
        created_at: nowIso(),
        updated_at: nowIso(),
        shop,
        status: "active",
        row_version: 1,
      };

      await repo.writeRepo(shop, [product]);

      const updated = await repo.updateProductInRepo(shop, {
        id: "1",
        sku: "sku-1b",
      });
      expect(updated.sku).toBe("sku-1b");
      expect(updated.row_version).toBe(2);
      await expect(
        repo.updateProductInRepo(shop, { id: "x" })
      ).rejects.toThrow();

      const copy = await repo.duplicateProductInRepo(shop, "1");
      expect(copy.id).not.toBe("1");

      const list = await repo.readRepo(shop);
      expect(list).toHaveLength(2);
      await expect(repo.duplicateProductInRepo(shop, "x")).rejects.toThrow();

      await repo.deleteProductFromRepo(shop, "1");
      const afterDelete = await repo.readRepo(shop);
      expect(afterDelete).toHaveLength(1);
      await expect(
        repo.deleteProductFromRepo(shop, "missing")
      ).rejects.toThrow();
    });
  });
});
