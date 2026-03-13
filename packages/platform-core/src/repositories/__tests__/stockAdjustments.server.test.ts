import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

describe("stock adjustments repository", () => {
  const origDataRoot = process.env.DATA_ROOT;
  const origInventoryBackend = process.env.INVENTORY_BACKEND;
  const origSkipAlert = process.env.SKIP_STOCK_ALERT;

  let tmpRoot: string | undefined;

  beforeEach(async () => {
    jest.resetModules();
    process.env.INVENTORY_BACKEND = "json";
    process.env.SKIP_STOCK_ALERT = "1";
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "platform-core-stock-adjustments-"));
    process.env.DATA_ROOT = tmpRoot;
    await fs.mkdir(path.join(tmpRoot, "demo"), { recursive: true });
  });

  afterEach(async () => {
    jest.resetModules();

    if (origDataRoot === undefined) delete process.env.DATA_ROOT;
    else process.env.DATA_ROOT = origDataRoot;

    if (origInventoryBackend === undefined) delete process.env.INVENTORY_BACKEND;
    else process.env.INVENTORY_BACKEND = origInventoryBackend;

    if (origSkipAlert === undefined) delete process.env.SKIP_STOCK_ALERT;
    else process.env.SKIP_STOCK_ALERT = origSkipAlert;

    if (tmpRoot) {
      await fs.rm(tmpRoot, { recursive: true, force: true });
      tmpRoot = undefined;
    }
  });

  it("applies delta, writes inventory, and returns a result", async () => {
    const { applyStockAdjustment } = await import("../stockAdjustments.server");

    const idempotencyKey = randomUUID();
    const result = await applyStockAdjustment("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 5, reason: "correction" }],
      note: "stock-take",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.report).toMatchObject({
      shop: "demo",
      idempotencyKey,
      dryRun: false,
      note: "stock-take",
      created: 1,
      updated: 0,
    });
    expect(result.report.items).toEqual([
      expect.objectContaining({
        sku: "sku-1",
        productId: "p-1",
        variantAttributes: {},
        delta: 5,
        previousQuantity: 0,
        nextQuantity: 5,
        reason: "correction",
      }),
    ]);
    expect(result.event.id).not.toBe("dry-run");

    const inventoryPath = path.join(tmpRoot!, "demo", "inventory.json");
    expect(await pathExists(inventoryPath)).toBe(true);

    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as Array<{
      sku: string;
      productId: string;
      quantity: number;
    }>;
    expect(inventory).toEqual([{ sku: "sku-1", productId: "p-1", quantity: 5 }]);
  });

  it("applies a multi-item batch: two SKUs adjusted in a single call", async () => {
    const { applyStockAdjustment } = await import("../stockAdjustments.server");

    const idempotencyKey = randomUUID();
    const result = await applyStockAdjustment("demo", {
      idempotencyKey,
      items: [
        { sku: "sku-a", productId: "p-a", quantity: 10, reason: "correction" },
        { sku: "sku-b", productId: "p-b", quantity: -3, reason: "damage" },
      ],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.report.created).toBe(2);
    expect(result.report.updated).toBe(0);
    expect(result.report.items).toHaveLength(2);

    const skuA = result.report.items.find((i) => i.sku === "sku-a");
    const skuB = result.report.items.find((i) => i.sku === "sku-b");

    expect(skuA).toMatchObject({ delta: 10, previousQuantity: 0, nextQuantity: 10 });
    // nextQuantity floors at 0: 0 + (-3) → max(0, -3) = 0
    expect(skuB).toMatchObject({ delta: -3, previousQuantity: 0, nextQuantity: 0 });

    const inventoryPath = path.join(tmpRoot!, "demo", "inventory.json");
    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as Array<{
      sku: string;
      quantity: number;
    }>;
    const aEntry = inventory.find((i) => i.sku === "sku-a");
    const bEntry = inventory.find((i) => i.sku === "sku-b");
    expect(aEntry?.quantity).toBe(10);
    expect(bEntry?.quantity).toBe(0);
  });

  it("enforces idempotency and does not double-apply", async () => {
    const { applyStockAdjustment } = await import("../stockAdjustments.server");

    const idempotencyKey = randomUUID();
    const first = await applyStockAdjustment("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 3, reason: "correction" }],
    });
    expect(first.ok).toBe(true);

    const second = await applyStockAdjustment("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 3, reason: "correction" }],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.duplicate).toBe(true);

    const inventoryPath = path.join(tmpRoot!, "demo", "inventory.json");
    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as Array<{
      sku: string;
      quantity: number;
    }>;
    // Quantity must be 3 (first apply only) not 6
    expect(inventory.find((i) => i.sku === "sku-1")?.quantity).toBe(3);
  });

  it("returns PRODUCT_MISMATCH when sku exists with a different productId", async () => {
    const { applyStockAdjustment } = await import("../stockAdjustments.server");

    const first = await applyStockAdjustment("demo", {
      idempotencyKey: randomUUID(),
      items: [{ sku: "sku-1", productId: "p-1", quantity: 1, reason: "correction" }],
    });
    expect(first.ok).toBe(true);

    const mismatch = await applyStockAdjustment("demo", {
      idempotencyKey: randomUUID(),
      items: [{ sku: "sku-1", productId: "p-2", quantity: 1, reason: "correction" }],
    });
    expect(mismatch).toMatchObject({ ok: false, code: "PRODUCT_MISMATCH" });
  });

  it("supports dryRun without writing inventory", async () => {
    const { applyStockAdjustment } = await import("../stockAdjustments.server");

    const idempotencyKey = randomUUID();
    const result = await applyStockAdjustment("demo", {
      idempotencyKey,
      dryRun: true,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 4, reason: "manual_recount" }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.report.dryRun).toBe(true);
    expect(result.event.id).toBe("dry-run");

    const inventoryPath = path.join(tmpRoot!, "demo", "inventory.json");
    expect(await pathExists(inventoryPath)).toBe(false);
  });
});
