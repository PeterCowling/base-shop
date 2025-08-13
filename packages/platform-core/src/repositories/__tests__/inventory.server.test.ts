import { promises as fs } from "node:fs";
import * as path from "node:path";
import os from "node:os";

describe("inventory repository concurrency", () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(async () => {
    origCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-test-"));
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(origCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("handles simultaneous writes without corruption", async () => {
    process.env.SKIP_STOCK_ALERT = "1";
    const { writeInventory, readInventory } = await import("../inventory.server");
    const shop = "demo";
    const sets = [
      [
        {
          sku: "a",
          productId: "p1",
          quantity: 1,
          variantAttributes: {},
        },
      ],
      [
        {
          sku: "b",
          productId: "p2",
          quantity: 2,
          variantAttributes: {},
        },
      ],
    ];

    await Promise.all(sets.map((s) => writeInventory(shop, s)));

    const result = await readInventory(shop);
    const json = JSON.stringify(result);
    expect(sets.map((s) => JSON.stringify(s))).toContain(json);
  });

  it("updates items concurrently without losing changes", async () => {
    process.env.SKIP_STOCK_ALERT = "1";
    const { writeInventory, readInventory, updateInventoryItem } = await import(
      "../inventory.server",
    );
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
      { sku: "a", productId: "p1", quantity: 5, variantAttributes: {} },
    ]);
  });

  it("supports partial updates", async () => {
    process.env.SKIP_STOCK_ALERT = "1";
    const { writeInventory, readInventory, updateInventoryItem } = await import(
      "../inventory.server",
    );
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

    await updateInventoryItem(shop, "a", {}, (current) => ({
      ...current!,
      quantity: 10,
    }));

    const result = await readInventory(shop);
    expect(result).toEqual([
      {
        sku: "a",
        productId: "p1",
        quantity: 10,
        lowStockThreshold: 2,
        variantAttributes: {},
      },
    ]);
  });
});
