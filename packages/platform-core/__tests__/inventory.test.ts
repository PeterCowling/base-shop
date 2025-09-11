import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { InventoryItem } from "../src/types/inventory";

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
  process.env.NEXTAUTH_SECRET = "test";
  process.env.SESSION_SECRET = "test";
  jest.resetModules();

  const repo = await import("../src/repositories/inventory.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("inventory repository", () => {
  it(
    "readInventory throws when file missing or invalid",
    async () => {
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
  }, 20000);

  it("writes inventory records with variant attributes", async () => {
    await withRepo(async (repo, shop, dir) => {
      const items: InventoryItem[] = [
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

  it("converts legacy variant field when reading", async () => {
    await withRepo(async (repo, shop, dir) => {
      const file = path.join(dir, "data", "shops", shop, "inventory.json");
      await fs.writeFile(
        file,
        JSON.stringify([
          { sku: "s1", productId: "p1", quantity: 1, variant: { size: "m" } },
        ]),
        "utf8",
      );
      await expect(repo.readInventory(shop)).resolves.toEqual([
        {
          sku: "s1",
          productId: "p1",
          quantity: 1,
          variantAttributes: { size: "m" },
        },
      ]);
    });
  });

  it("skips stock alert when disabled", async () => {
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
      process.env.SKIP_STOCK_ALERT = "1";
      await repo.writeInventory(shop, items);
      expect(checkAndAlert).not.toHaveBeenCalled();
    });
  });

  it("calls checkAndAlert when low stock and SKIP_STOCK_ALERT unset", async () => {
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
      delete process.env.SKIP_STOCK_ALERT;
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
      expect(() => repo.writeInventory(shop, bad as any)).toThrow();
    });
  });

  it("writeInventory rejects negative quantity or lowStockThreshold", async () => {
    await withRepo(async (repo, shop) => {
      jest.doMock("../src/services/stockAlert.server", () => ({
        checkAndAlert: jest.fn(),
      }));
      const negativeQty = [
        {
          sku: "sku-1",
          productId: "p1",
          variantAttributes: {},
          quantity: -1,
        },
      ];
      expect(() => repo.writeInventory(shop, negativeQty as any)).toThrow();

      const negativeThreshold = [
        {
          sku: "sku-1",
          productId: "p1",
          variantAttributes: {},
          quantity: 1,
          lowStockThreshold: -1,
        },
      ];
      expect(() => repo.writeInventory(shop, negativeThreshold as any)).toThrow();
    });
  });

  it("indexes inventory by sku and variant attributes", async () => {
    await withRepo(async (repo, shop) => {
      const items = [
        {
          sku: "sku-1",
          productId: "p1",
          variantAttributes: { size: "m", color: "red" },
          quantity: 1,
        },
        {
          sku: "sku-1",
          productId: "p1",
          variantAttributes: { size: "l", color: "red" },
          quantity: 3,
        },
      ];
      await repo.writeInventory(shop, items);
      const map = await repo.readInventoryMap(shop);
      expect(
        map[repo.variantKey("sku-1", { size: "m", color: "red" })],
      ).toEqual(items[0]);
      expect(
        map[repo.variantKey("sku-1", { size: "l", color: "red" })].quantity,
      ).toBe(3);
    });
  });

  it("updates and returns inventory items", async () => {
    await withRepo(async (repo, shop) => {
      const first = await repo.updateInventoryItem(shop, "sku-1", {}, () => ({
        sku: "sku-1",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
      }));
      expect(first).toEqual({
        sku: "sku-1",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
      });

      const second = await repo.updateInventoryItem(shop, "sku-1", {}, (current) => ({
        ...current!,
        productId: "p1",
        quantity: current!.quantity + 1,
      }));
      expect(second).toEqual({
        sku: "sku-1",
        productId: "p1",
        quantity: 2,
        variantAttributes: {},
      });

      const items = await repo.readInventory(shop);
      expect(items).toEqual([
        { sku: "sku-1", productId: "p1", quantity: 2, variantAttributes: {} },
      ]);
    });
  });

  it("removes inventory items when mutate returns undefined", async () => {
    await withRepo(async (repo, shop) => {
      await repo.updateInventoryItem(shop, "sku-1", {}, () => ({
        sku: "sku-1",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
      }));
      const removed = await repo.updateInventoryItem(shop, "sku-1", {}, () => undefined);
      expect(removed).toBeUndefined();
      await expect(repo.readInventory(shop)).resolves.toEqual([]);
    });
  });

  it("handles missing inventory file when updating", async () => {
    await withRepo(async (repo, shop, dir) => {
      const created = await repo.updateInventoryItem(shop, "sku-1", {}, () => ({
        sku: "sku-1",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
      }));
      expect(created).toEqual({
        sku: "sku-1",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
      });
      const buf = await fs.readFile(
        path.join(dir, "data", "shops", shop, "inventory.json"),
        "utf8",
      );
      expect(JSON.parse(buf)).toEqual([
        { sku: "sku-1", productId: "p1", quantity: 1 },
      ]);
      await expect(repo.readInventory(shop)).resolves.toEqual([
        { sku: "sku-1", productId: "p1", quantity: 1, variantAttributes: {} },
      ]);
    });
  });
});
