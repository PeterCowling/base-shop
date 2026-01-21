import "server-only";

import { promises as fs } from "fs";
import * as path from "path";
import { ulid } from "ulid";

import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops/index";
import { type InventoryItem,inventoryItemSchema, variantKey } from "../types/inventory";
import {
  type StockInflowActor,
  type StockInflowEvent,
  stockInflowEventSchema,
  type StockInflowItemResult,
  type StockInflowReport,
  stockInflowRequestSchema,
} from "../types/stockInflows";

import { readInventory, writeInventory } from "./inventory.server";

const INFLOWS_FILENAME = "stock-inflows.jsonl";

type FileLockOptions = { timeoutMs?: number; staleMs?: number };

async function acquireLock(
  lockFile: string,
  { timeoutMs = 5000, staleMs = 60_000 }: FileLockOptions = {},
): Promise<fs.FileHandle> {
  const start = Date.now();
  while (true) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path derived from validated shop and fixed filename
      return await fs.open(lockFile, "wx");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      const elapsed = Date.now() - start;
      if (elapsed >= timeoutMs) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path derived from validated shop and fixed filename
        const stat = await fs.stat(lockFile).catch(() => undefined);
        const isStale =
          typeof stat?.mtimeMs === "number" && Date.now() - stat.mtimeMs > staleMs;
        if (isStale) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path derived from validated shop and fixed filename
          await fs.unlink(lockFile).catch(() => {});
          continue;
        }
        throw new Error(
          `Timed out acquiring stock inflow lock ${lockFile} after ${timeoutMs}ms`,
        ); // i18n-exempt -- developer error message
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

function inflowsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, INFLOWS_FILENAME);
}

function inventoryLockPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory.lock");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path uses validated shop and trusted base
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function readAll(shop: string): Promise<StockInflowEvent[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path uses validated shop and trusted base
    const buf = await fs.readFile(inflowsPath(shop), "utf8");
    const lines = buf.split("\n").map((line) => line.trim()).filter(Boolean);
    return lines.map((line) => stockInflowEventSchema.parse(JSON.parse(line) as unknown));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error(`Failed to read stock inflows for ${shop}`, err);
    throw err;
  }
}

async function append(shop: string, event: StockInflowEvent): Promise<void> {
  await ensureDir(shop);
  const line = `${JSON.stringify(event)}\n`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: path uses validated shop and trusted base
  await fs.appendFile(inflowsPath(shop), line, "utf8");
}

export async function listStockInflows(
  shop: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<StockInflowEvent[]> {
  const safeShop = validateShopName(shop);
  const events = await readAll(safeShop);
  const sorted = [...events].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
  return sorted.slice(0, Math.max(1, Math.floor(limit)));
}

export type ReceiveStockInflowResult =
  | { ok: true; duplicate: false; report: StockInflowReport; event: StockInflowEvent }
  | { ok: true; duplicate: true; report: StockInflowReport; event: StockInflowEvent }
  | { ok: false; code: string; message: string; details?: unknown };

export async function receiveStockInflow(
  shop: string,
  payload: unknown,
  options: { actor?: StockInflowActor } = {},
): Promise<ReceiveStockInflowResult> {
  const safeShop = validateShopName(shop);
  const parsed = stockInflowRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_REQUEST", message: parsed.error.message };
  }

  const dryRun = Boolean(parsed.data.dryRun);
  const receivedAt = new Date().toISOString();
  const lockFile = inventoryLockPath(safeShop);
  await ensureDir(safeShop);
  const handle = await acquireLock(lockFile);

  try {
    const existing = await readAll(safeShop);
    const prior = existing.find((e) => e.idempotencyKey === parsed.data.idempotencyKey);
    if (prior) {
      const report: StockInflowReport = {
        shop: safeShop,
        idempotencyKey: prior.idempotencyKey,
        dryRun: false,
        receivedAt: prior.receivedAt,
        ...(prior.receivedBy ? { receivedBy: prior.receivedBy } : {}),
        ...(prior.note ? { note: prior.note } : {}),
        created: prior.report.created,
        updated: prior.report.updated,
        items: prior.report.items,
      };
      return { ok: true, duplicate: true, report, event: prior };
    }

    const inventory = await readInventory(safeShop);
    const index = new Map<string, InventoryItem>(
      inventory.map((item) => [variantKey(item.sku, item.variantAttributes), item]),
    );

    const results: StockInflowItemResult[] = [];
    let created = 0;
    let updated = 0;

    for (const item of parsed.data.items) {
      const attrs = item.variantAttributes ?? {};
      const key = variantKey(item.sku, attrs);
      const current = index.get(key);
      if (current && current.productId !== item.productId) {
        return {
          ok: false,
          code: "PRODUCT_MISMATCH",
          message: `Inventory productId mismatch for sku ${item.sku}`,
          details: { sku: item.sku, expected: current.productId, provided: item.productId },
        };
      }

      const previousQuantity = current?.quantity ?? 0;
      const nextQuantity = previousQuantity + item.quantity;

      const next: InventoryItem = inventoryItemSchema.parse({
        ...(current ?? {}),
        sku: item.sku,
        productId: current?.productId ?? item.productId,
        quantity: nextQuantity,
        variantAttributes: attrs,
      });

      if (current) {
        updated += 1;
      } else {
        created += 1;
      }
      index.set(key, next);

      results.push({
        sku: item.sku,
        productId: next.productId,
        variantAttributes: attrs,
        delta: item.quantity,
        previousQuantity,
        nextQuantity,
      });
    }

    const report: StockInflowReport = {
      shop: safeShop,
      idempotencyKey: parsed.data.idempotencyKey,
      dryRun,
      receivedAt,
      ...(options.actor ? { receivedBy: options.actor } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
      created,
      updated,
      items: results,
    };

    if (dryRun) {
      return {
        ok: true,
        duplicate: false,
        report,
        event: {
          id: "dry-run",
          idempotencyKey: parsed.data.idempotencyKey,
          shop: safeShop,
          receivedAt,
          ...(options.actor ? { receivedBy: options.actor } : {}),
          ...(parsed.data.note ? { note: parsed.data.note } : {}),
          items: parsed.data.items.map((i) => ({
            sku: i.sku,
            productId: i.productId,
            quantity: i.quantity,
            variantAttributes: i.variantAttributes ?? {},
          })),
          report: { created, updated, items: results },
        },
      };
    }

    const nextInventory = [...index.values()].sort((a, b) =>
      variantKey(a.sku, a.variantAttributes).localeCompare(variantKey(b.sku, b.variantAttributes)),
    );

    await writeInventory(safeShop, nextInventory);

    const event: StockInflowEvent = stockInflowEventSchema.parse({
      id: ulid(),
      idempotencyKey: parsed.data.idempotencyKey,
      shop: safeShop,
      receivedAt,
      ...(options.actor ? { receivedBy: options.actor } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
      items: parsed.data.items.map((i) => ({
        sku: i.sku,
        productId: i.productId,
        quantity: i.quantity,
        variantAttributes: i.variantAttributes ?? {},
      })),
      report: { created, updated, items: results },
    });

    await append(safeShop, event);

    return { ok: true, duplicate: false, report, event };
  } finally {
    await handle.close();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-UPL: lock path derived from validated shop and fixed filename
    await fs.unlink(lockFile).catch(() => {});
  }
}
