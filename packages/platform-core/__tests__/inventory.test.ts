import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { InventoryItem } from "../src/types/inventory";

async function withRepo(
  backend: "json" | "sqlite",
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
  process.env.INVENTORY_BACKEND = backend;
  jest.resetModules();

  const repo = await import("../src/repositories/inventory.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
    delete process.env.INVENTORY_BACKEND;
  }
}

describe("inventory repository", () => {
  it("readInventory throws when file missing or invalid", async () => {
    await withRepo("json", async (repo, shop, dir) => {
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
    await withRepo("json", async (repo, shop, dir) => {
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
    await withRepo("json", async (repo, shop, dir) => {
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
    await withRepo("json", async (repo, shop, dir) => {
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
    await withRepo("json", async (repo, shop) => {
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

  it("writeInventory throws on invalid items", async () => {
    await withRepo("json", async (repo, shop) => {
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

  it("writeInventory rejects negative quantity or lowStockThreshold", async () => {
    await withRepo("json", async (repo, shop) => {
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
      await expect(repo.writeInventory(shop, negativeQty as any)).rejects.toThrow();

      const negativeThreshold = [
        {
          sku: "sku-1",
          productId: "p1",
          variantAttributes: {},
          quantity: 1,
          lowStockThreshold: -1,
        },
      ];
      await expect(repo.writeInventory(shop, negativeThreshold as any)).rejects.toThrow();
    });
  });

  it("indexes inventory by sku and variant attributes", async () => {
    await withRepo("json", async (repo, shop) => {
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
});

describe("inventory repository (sqlite)", () => {
  it("updates and returns inventory items", async () => {
    await withRepo("sqlite", async (repo, shop) => {
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
        { sku: "sku-1", quantity: 2, variantAttributes: {} },
      ]);
    });
  });
});
