import "server-only";

import { promises as fs } from "fs";
import * as path from "path";
import { ulid } from "ulid";
import { validateShopName } from "../shops/index";
import { DATA_ROOT } from "../dataRoot";
import {
  inventoryItemSchema,
  variantKey,
  type InventoryItem,
} from "../types/inventory";
import { readInventory, writeInventory } from "./inventory.server";
import {
  adjustmentReasonSchema,
  stockAdjustmentEventSchema,
  stockAdjustmentRequestSchema,
  type StockAdjustmentActor,
  type StockAdjustmentEvent,
  type StockAdjustmentItemResult,
  type StockAdjustmentReport,
} from "../types/stockAdjustments";

const ADJUSTMENTS_FILENAME = "stock-adjustments.jsonl";

type FileLockOptions = { timeoutMs?: number; staleMs?: number };

async function acquireLock(
  lockFile: string,
  { timeoutMs = 5000, staleMs = 60_000 }: FileLockOptions = {},
): Promise<fs.FileHandle> {
  const start = Date.now();
  while (true) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-ADJ: lock path derived from validated shop and fixed filename
      return await fs.open(lockFile, "wx");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      const elapsed = Date.now() - start;
      if (elapsed >= timeoutMs) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-ADJ: lock path derived from validated shop and fixed filename
        const stat = await fs.stat(lockFile).catch(() => undefined);
        const isStale =
          typeof stat?.mtimeMs === "number" && Date.now() - stat.mtimeMs > staleMs;
        if (isStale) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-ADJ: lock path derived from validated shop and fixed filename
          await fs.unlink(lockFile).catch(() => {});
          continue;
        }
        throw new Error(
          `Timed out acquiring stock adjustment lock ${lockFile} after ${timeoutMs}ms`,
        ); // i18n-exempt -- developer error message
      }
      await new Promise((res) => setTimeout(res, 50));
    }
  }
}

function adjustmentsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, ADJUSTMENTS_FILENAME);
}

function inventoryLockPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory.lock");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-ADJ: path uses validated shop and trusted base
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function readAll(shop: string): Promise<StockAdjustmentEvent[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-ADJ: path uses validated shop and trusted base
    const buf = await fs.readFile(adjustmentsPath(shop), "utf8");
    const lines = buf.split("\n").map((line) => line.trim()).filter(Boolean);
    return lines.map((line) => stockAdjustmentEventSchema.parse(JSON.parse(line) as unknown));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error(`Failed to read stock adjustments for ${shop}`, err);
    throw err;
  }
}

async function append(shop: string, event: StockAdjustmentEvent): Promise<void> {
  await ensureDir(shop);
  const line = `${JSON.stringify(event)}\n`;
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-ADJ: path uses validated shop and trusted base
  await fs.appendFile(adjustmentsPath(shop), line, "utf8");
}

export async function listStockAdjustments(
  shop: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<StockAdjustmentEvent[]> {
  const safeShop = validateShopName(shop);
  const events = await readAll(safeShop);
  const sorted = [...events].sort((a, b) => b.adjustedAt.localeCompare(a.adjustedAt));
  return sorted.slice(0, Math.max(1, Math.floor(limit)));
}

export type StockAdjustmentResult =
  | { ok: true; duplicate: false; report: StockAdjustmentReport; event: StockAdjustmentEvent }
  | { ok: true; duplicate: true; report: StockAdjustmentReport; event: StockAdjustmentEvent }
  | { ok: false; code: string; message: string; details?: unknown };

export async function applyStockAdjustment(
  shop: string,
  payload: unknown,
  options: { actor?: StockAdjustmentActor } = {},
): Promise<StockAdjustmentResult> {
  const safeShop = validateShopName(shop);
  const parsed = stockAdjustmentRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, code: "INVALID_REQUEST", message: parsed.error.message };
  }

  const dryRun = Boolean(parsed.data.dryRun);
  const adjustedAt = new Date().toISOString();
  const lockFile = inventoryLockPath(safeShop);
  await ensureDir(safeShop);
  const handle = await acquireLock(lockFile);

  try {
    const existing = await readAll(safeShop);
    const prior = existing.find((e) => e.idempotencyKey === parsed.data.idempotencyKey);
    if (prior) {
      const report: StockAdjustmentReport = {
        shop: safeShop,
        idempotencyKey: prior.idempotencyKey,
        dryRun: false,
        adjustedAt: prior.adjustedAt,
        ...(prior.adjustedBy ? { adjustedBy: prior.adjustedBy } : {}),
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

    const results: StockAdjustmentItemResult[] = [];
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
      const nextQuantity = Math.max(0, previousQuantity + item.quantity);

      const next: InventoryItem = inventoryItemSchema.parse({
        ...(current ?? {}),
        sku: item.sku,
        productId: current?.productId ?? item.productId,
        quantity: nextQuantity,
        variantAttributes: attrs,
        ...(current?.lowStockThreshold !== undefined
          ? { lowStockThreshold: current.lowStockThreshold }
          : {}),
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
        reason: adjustmentReasonSchema.parse(item.reason),
      });
    }

    const report: StockAdjustmentReport = {
      shop: safeShop,
      idempotencyKey: parsed.data.idempotencyKey,
      dryRun,
      adjustedAt,
      ...(options.actor ? { adjustedBy: options.actor } : {}),
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
          adjustedAt,
          ...(options.actor ? { adjustedBy: options.actor } : {}),
          ...(parsed.data.note ? { note: parsed.data.note } : {}),
          items: parsed.data.items.map((i) => ({
            sku: i.sku,
            productId: i.productId,
            quantity: i.quantity,
            variantAttributes: i.variantAttributes ?? {},
            reason: adjustmentReasonSchema.parse(i.reason),
          })),
          report: { created, updated, items: results },
        },
      };
    }

    const nextInventory = [...index.values()].sort((a, b) =>
      variantKey(a.sku, a.variantAttributes).localeCompare(variantKey(b.sku, b.variantAttributes)),
    );

    await writeInventory(safeShop, nextInventory);

    const event: StockAdjustmentEvent = stockAdjustmentEventSchema.parse({
      id: ulid(),
      idempotencyKey: parsed.data.idempotencyKey,
      shop: safeShop,
      adjustedAt,
      ...(options.actor ? { adjustedBy: options.actor } : {}),
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
      items: parsed.data.items.map((i) => ({
        sku: i.sku,
        productId: i.productId,
        quantity: i.quantity,
        variantAttributes: i.variantAttributes ?? {},
        reason: adjustmentReasonSchema.parse(i.reason),
      })),
      report: { created, updated, items: results },
    });

    await append(safeShop, event);

    return { ok: true, duplicate: false, report, event };
  } finally {
    try {
      await handle.close();
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- COM-ADJ: lock path derived from validated shop and fixed filename
      await fs.unlink(lockFile).catch(() => {});
    } catch {
      // ignore
    }
  }
}
