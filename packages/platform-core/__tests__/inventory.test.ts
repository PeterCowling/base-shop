import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (
    repo: typeof import("../src/repositories/inventory.server"),
    shop: string,
    dir: string,
  ) => Promise<void>,
  backend: "json" | "sqlite" = "json",
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
  const origBackend = process.env.INVENTORY_BACKEND;
  if (backend === "sqlite") process.env.INVENTORY_BACKEND = "sqlite";
  else delete process.env.INVENTORY_BACKEND;
  jest.resetModules();
  if (backend === "sqlite") {
    jest.doMock(
      "better-sqlite3",
      () => {
        class Statement {
          constructor(private fn: (...args: any[]) => any) {}
          run(...args: any[]) {
            return this.fn(...args);
          }
          get(...args: any[]) {
            return this.fn(...args);
          }
          all(...args: any[]) {
            return this.fn(...args);
          }
        }
        const stores = new Map<
          string,
          Map<string, { sku: string; variantAttributes: string; quantity: number }>
        >();
        class MockDB {
          rows: Map<string, { sku: string; variantAttributes: string; quantity: number }>;
          constructor(file: string) {
            this.rows = stores.get(file) ?? new Map();
            stores.set(file, this.rows);
          }
          exec() {}
          prepare(sql: string) {
            if (sql.startsWith("SELECT sku, variantAttributes, quantity FROM inventory WHERE")) {
              return new Statement((sku: string, attrs: string) => {
                return this.rows.get(`${sku}|${attrs}`);
              });
            }
            if (sql.startsWith("SELECT sku, variantAttributes, quantity FROM inventory")) {
              return new Statement(() => Array.from(this.rows.values()));
            }
            if (sql.startsWith("REPLACE INTO inventory")) {
              return new Statement((sku: string, attrs: string, qty: number) => {
                this.rows.set(`${sku}|${attrs}`, {
                  sku,
                  variantAttributes: attrs,
                  quantity: qty,
                });
              });
            }
            if (sql.startsWith("DELETE FROM inventory WHERE")) {
              return new Statement((sku: string, attrs: string) => {
                this.rows.delete(`${sku}|${attrs}`);
              });
            }
            if (sql.startsWith("DELETE FROM inventory")) {
              return new Statement(() => {
                this.rows.clear();
              });
            }
            throw new Error("Unsupported SQL in mock: " + sql);
          }
          transaction(fn: Function) {
            return (...args: any[]) => fn(...args);
          }
        }
        return MockDB;
      },
      { virtual: true },
    );
  }

  const repo = await import("../src/repositories/inventory.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
    if (origBackend === undefined) delete process.env.INVENTORY_BACKEND;
    else process.env.INVENTORY_BACKEND = origBackend;
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

  it("updates items via sqlite backend", async () => {
    await withRepo(
      async (repo, shop) => {
        await repo.writeInventory(shop, [
          {
            sku: "sku-1",
            productId: "p1",
            quantity: 1,
            variantAttributes: {},
          },
        ]);
        const updated = await repo.updateInventoryItem(
          shop,
          "sku-1",
          {},
          (current) => ({
            sku: "sku-1",
            productId: "p1",
            quantity: (current?.quantity ?? 0) + 2,
            variantAttributes: {},
          }),
        );
        expect(updated).toEqual({
          sku: "sku-1",
          productId: "p1",
          quantity: 3,
          variantAttributes: {},
        });
        await expect(repo.readInventory(shop)).resolves.toEqual([
          { sku: "sku-1", quantity: 3, variantAttributes: {} },
        ]);
      },
      "sqlite",
    );
  });
});
