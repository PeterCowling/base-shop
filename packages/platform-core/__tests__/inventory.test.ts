import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (
    repo: typeof import("../src/repositories/inventory.server"),
    shop: string,
    dir: string,
  ) => Promise<void>,
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  process.env.STRIPE_SECRET_KEY = "sk";
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk";
  jest.resetModules();

  const repo = await import("../src/repositories/inventory.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("inventory repository", () => {
  it("readInventory throws when file missing or invalid", async () => {
    await withRepo(async (repo, shop, dir) => {
      await expect(repo.readInventory(shop)).rejects.toThrow();

      await fs.writeFile(
        path.join(dir, "data", "shops", shop, "inventory.json"),
        "bad",
        "utf8",
      );

      await expect(repo.readInventory(shop)).rejects.toThrow();

      await fs.writeFile(
        path.join(dir, "data", "shops", shop, "inventory.json"),
        JSON.stringify([{ sku: "sku-1", quantity: 1 }]),
        "utf8",
      );

      await expect(repo.readInventory(shop)).rejects.toThrow();
    });
  });

  it("writes inventory records with variant attributes", async () => {
    await withRepo(async (repo, shop, dir) => {
      const items = [
        {
          sku: "sku-1",
          productId: "prod-1",
          variantAttributes: { size: "m", color: "red" },
          quantity: 2,
          lowStockThreshold: 1,
        },
        {
          sku: "sku-2",
          productId: "prod-2",
          variantAttributes: { material: "cotton", pattern: "striped" },
          quantity: 0,
        },
      ];
      await repo.writeInventory(shop, items);
      const buf = await fs.readFile(
        path.join(dir, "data", "shops", shop, "inventory.json"),
        "utf8",
      );
      expect(JSON.parse(buf)).toEqual(items);
      await expect(repo.readInventory(shop)).resolves.toEqual(items);
    });
  });

  it("normalizes missing variantAttributes when reading", async () => {
    await withRepo(async (repo, shop, dir) => {
      const file = path.join(dir, "data", "shops", shop, "inventory.json");
      await fs.writeFile(
        file,
        JSON.stringify([
          { sku: "s1", productId: "p1", quantity: 1 },
        ]),
        "utf8",
      );
      await expect(repo.readInventory(shop)).resolves.toEqual([
        {
          sku: "s1",
          productId: "p1",
          quantity: 1,
          variantAttributes: {},
        },
      ]);
    });
  });

  it("invokes checkAndAlert after writing", async () => {
    await withRepo(async (repo, shop) => {
      const items = [
        {
          sku: "sku-1",
          productId: "p1",
          variantAttributes: { size: "m" },
          quantity: 1,
          lowStockThreshold: 2,
        },
      ];
      const checkAndAlert = jest.fn();
      jest.doMock("../src/services/stockAlert.server", () => ({ checkAndAlert }));
      await repo.writeInventory(shop, items);
      expect(checkAndAlert).toHaveBeenCalledWith(shop, items);
    });
  });

  it("writeInventory throws on invalid items", async () => {
    await withRepo(async (repo, shop) => {
      const bad = [
        {
          sku: "sku-1",
          productId: "prod-1",
          // non-string attribute value
          variantAttributes: { size: 42 as any },
          quantity: 1,
        },
      ];
      await expect(repo.writeInventory(shop, bad as any)).rejects.toThrow();
    });
  });
});
