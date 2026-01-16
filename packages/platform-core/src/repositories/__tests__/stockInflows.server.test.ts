import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

describe("stock inflows repository", () => {
  const origDataRoot = process.env.DATA_ROOT;
  const origInventoryBackend = process.env.INVENTORY_BACKEND;
  const origSkipAlert = process.env.SKIP_STOCK_ALERT;

  let tmpRoot: string | undefined;

  beforeEach(async () => {
    jest.resetModules();
    process.env.INVENTORY_BACKEND = "json";
    process.env.SKIP_STOCK_ALERT = "1";
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "platform-core-stock-inflows-"));
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

  it("applies deltas, writes inventory, and appends an inflow event", async () => {
    const { receiveStockInflow } = await import("../stockInflows.server");

    const idempotencyKey = randomUUID();
    const result = await receiveStockInflow("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 5 }],
      note: "PO-123",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.report).toMatchObject({
      shop: "demo",
      idempotencyKey,
      dryRun: false,
      note: "PO-123",
      created: 1,
      updated: 0,
    });
    expect(result.report.items).toEqual([
      {
        sku: "sku-1",
        productId: "p-1",
        variantAttributes: {},
        delta: 5,
        previousQuantity: 0,
        nextQuantity: 5,
      },
    ]);
    expect(result.event.id).not.toBe("dry-run");

    const inventoryPath = path.join(tmpRoot!, "demo", "inventory.json");
    const inflowsPath = path.join(tmpRoot!, "demo", "stock-inflows.jsonl");

    expect(await pathExists(inventoryPath)).toBe(true);
    expect(await pathExists(inflowsPath)).toBe(true);

    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as Array<{
      sku: string;
      productId: string;
      quantity: number;
      variantAttributes?: Record<string, string>;
    }>;
    expect(inventory).toEqual([{ sku: "sku-1", productId: "p-1", quantity: 5 }]);

    const lines = (await fs.readFile(inflowsPath, "utf8"))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines).toHaveLength(1);
    const event = JSON.parse(lines[0]) as any;
    expect(event).toMatchObject({
      idempotencyKey,
      shop: "demo",
      note: "PO-123",
      report: { created: 1, updated: 0 },
    });
  });

  it("enforces idempotency and does not double-apply", async () => {
    const { receiveStockInflow } = await import("../stockInflows.server");

    const idempotencyKey = randomUUID();
    const first = await receiveStockInflow("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 2 }],
    });
    expect(first.ok).toBe(true);

    const second = await receiveStockInflow("demo", {
      idempotencyKey,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 2 }],
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.duplicate).toBe(true);

    const inventoryPath = path.join(tmpRoot!, "demo", "inventory.json");
    const inflowsPath = path.join(tmpRoot!, "demo", "stock-inflows.jsonl");

    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as Array<{
      sku: string;
      productId: string;
      quantity: number;
    }>;
    expect(inventory).toEqual([{ sku: "sku-1", productId: "p-1", quantity: 2 }]);

    const lines = (await fs.readFile(inflowsPath, "utf8"))
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    expect(lines).toHaveLength(1);
  });

  it("returns PRODUCT_MISMATCH when sku exists with a different productId", async () => {
    const { receiveStockInflow } = await import("../stockInflows.server");

    const first = await receiveStockInflow("demo", {
      idempotencyKey: randomUUID(),
      items: [{ sku: "sku-1", productId: "p-1", quantity: 1 }],
    });
    expect(first.ok).toBe(true);

    const mismatch = await receiveStockInflow("demo", {
      idempotencyKey: randomUUID(),
      items: [{ sku: "sku-1", productId: "p-2", quantity: 1 }],
    });
    expect(mismatch).toMatchObject({ ok: false, code: "PRODUCT_MISMATCH" });
  });

  it("supports dryRun without writing inventory or appending the inflow log", async () => {
    const { receiveStockInflow } = await import("../stockInflows.server");

    const idempotencyKey = randomUUID();
    const result = await receiveStockInflow("demo", {
      idempotencyKey,
      dryRun: true,
      items: [{ sku: "sku-1", productId: "p-1", quantity: 2 }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.duplicate).toBe(false);
    expect(result.report.dryRun).toBe(true);
    expect(result.event.id).toBe("dry-run");

    const inventoryPath = path.join(tmpRoot!, "demo", "inventory.json");
    const inflowsPath = path.join(tmpRoot!, "demo", "stock-inflows.jsonl");

    expect(await pathExists(inventoryPath)).toBe(false);
    expect(await pathExists(inflowsPath)).toBe(false);
  });
});

