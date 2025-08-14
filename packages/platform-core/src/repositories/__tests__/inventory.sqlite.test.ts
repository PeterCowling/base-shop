import { jest } from "@jest/globals";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import os from "node:os";

// Simple in-memory mock of better-sqlite3 used for tests
const dbStore = new Map<string, any[]>();

class MockDatabase {
  file: string;
  constructor(file: string) {
    this.file = file;
    if (!dbStore.has(file)) dbStore.set(file, []);
  }
  exec(_sql: string) {}
  prepare(sql: string) {
    const data = dbStore.get(this.file)!;
    if (/SELECT/.test(sql)) {
      return {
        all: () =>
          data.map((i) => ({
            sku: i.sku,
            variantAttributes: JSON.stringify(i.variantAttributes || {}),
            quantity: i.quantity,
          })),
        get: (sku: string, attrsJson: string) => {
          const attrs = JSON.parse(attrsJson || "{}");
          const item = data.find(
            (it) =>
              it.sku === sku &&
              JSON.stringify(it.variantAttributes) ===
                JSON.stringify(attrs),
          );
          return (
            item && {
              sku: item.sku,
              quantity: item.quantity,
              variantAttributes: JSON.stringify(
                item.variantAttributes || {},
              ),
            }
          );
        },
      };
    }
    if (/REPLACE INTO/.test(sql)) {
      return {
        run: (sku: string, attrsJson: string, quantity: number) => {
          const attrs = JSON.parse(attrsJson || "{}");
          const idx = data.findIndex(
            (it) =>
              it.sku === sku &&
              JSON.stringify(it.variantAttributes) ===
                JSON.stringify(attrs),
          );
          const item = { sku, quantity, variantAttributes: attrs };
          if (idx === -1) data.push(item);
          else data[idx] = item;
        },
      };
    }
    if (/DELETE FROM inventory WHERE/.test(sql)) {
      return {
        run: (sku: string, attrsJson: string) => {
          const attrs = JSON.parse(attrsJson || "{}");
          const idx = data.findIndex(
            (it) =>
              it.sku === sku &&
              JSON.stringify(it.variantAttributes) ===
                JSON.stringify(attrs),
          );
          if (idx !== -1) data.splice(idx, 1);
        },
      };
    }
    if (/DELETE FROM inventory/.test(sql)) {
      return { run: () => { data.length = 0; } };
    }
    throw new Error(`Unsupported SQL in mock: ${sql}`);
  }
  transaction(fn: any) {
    return (...args: any[]) => fn(...args);
  }
}

jest.mock(
  "better-sqlite3",
  () => ({ __esModule: true, default: MockDatabase }),
  { virtual: true },
);

describe("inventory repository sqlite", () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(async () => {
    origCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-sqlite-"));
    process.chdir(tmpDir);
    dbStore.clear();
  });

  afterEach(async () => {
    process.chdir(origCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.INVENTORY_BACKEND;
    delete process.env.SKIP_STOCK_ALERT;
  });

  it("handles simultaneous writes without corruption", async () => {
    process.env.SKIP_STOCK_ALERT = "1";
    process.env.INVENTORY_BACKEND = "sqlite";
    const { writeInventory, readInventory } = await import(
      "../inventory.server",
    );
    const shop = "demo";

    await Promise.all([
      writeInventory(shop, [
        { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
      ]),
      writeInventory(shop, [
        { sku: "b", productId: "p2", quantity: 2, variantAttributes: {} },
      ]),
    ]);

    const result = await readInventory(shop);
    const expected = [
      [{ sku: "a", quantity: 1, variantAttributes: {} }],
      [{ sku: "b", quantity: 2, variantAttributes: {} }],
    ];
    expect(expected).toContainEqual(result);
  });

  it("updates items concurrently without losing changes", async () => {
    process.env.SKIP_STOCK_ALERT = "1";
    process.env.INVENTORY_BACKEND = "sqlite";
    const { writeInventory, readInventory, updateInventoryItem } =
      await import("../inventory.server");
    const shop = "demo";
    await writeInventory(shop, [
      { sku: "a", productId: "p1", quantity: 0, variantAttributes: {} },
    ]);

    await Promise.all(
      Array.from({ length: 5 }).map(() =>
        updateInventoryItem(shop, "a", {}, (current) => ({
          sku: "a",
          productId: "p1",
          variantAttributes: {},
          quantity: (current?.quantity ?? 0) + 1,
        })),
      ),
    );

    const result = await readInventory(shop);
    expect(result).toEqual([
      { sku: "a", quantity: 5, variantAttributes: {} },
    ]);
  });

  it("supports partial updates", async () => {
    process.env.SKIP_STOCK_ALERT = "1";
    process.env.INVENTORY_BACKEND = "sqlite";
    const { writeInventory, readInventory, updateInventoryItem } =
      await import("../inventory.server");
    const shop = "demo";
    await writeInventory(shop, [
      {
        sku: "a",
        productId: "p1",
        quantity: 1,
        lowStockThreshold: 2,
        variantAttributes: {},
      },
    ]);

    await updateInventoryItem(shop, "a", {}, () => ({
      sku: "a",
      productId: "p1",
      variantAttributes: {},
      quantity: 10,
    }));

    const result = await readInventory(shop);
    expect(result).toEqual([
      { sku: "a", quantity: 10, variantAttributes: {} },
    ]);
  });
});

