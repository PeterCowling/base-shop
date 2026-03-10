import "server-only";

import { ulid } from "ulid";

import { prisma } from "../db";
import { validateShopName } from "../shops/index";
import {
  type InventoryItem,
  inventoryItemSchema,
  variantKey,
} from "../types/inventory";
import {
  adjustmentReasonSchema,
  type StockAdjustmentActor,
  type StockAdjustmentEvent,
  stockAdjustmentEventSchema,
  type StockAdjustmentItemResult,
  type StockAdjustmentReport,
  stockAdjustmentRequestSchema,
} from "../types/stockAdjustments";

import { readInventory, writeInventory } from "./inventory.server";

export type AuditEventEntry = {
  id: string;
  shopId: string;
  type: string;
  sku: string;
  variantKey: string;
  quantityDelta: number;
  note: string | null;
  referenceId: string | null;
  operatorId: string | null;
  createdAt: Date;
};

export type StockAdjustmentResult =
  | { ok: true; duplicate: false; report: StockAdjustmentReport; event: StockAdjustmentEvent }
  | { ok: true; duplicate: true; report: StockAdjustmentReport; event: StockAdjustmentEvent }
  | { ok: false; code: string; message: string; details?: unknown };

export async function listStockAdjustments(
  shop: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<AuditEventEntry[]> {
  const safeShop = validateShopName(shop);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies by generated schema
  return (prisma as any).inventoryAuditEvent.findMany({
    where: { shopId: safeShop, type: "adjustment" },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.floor(limit)),
  });
}

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

  // Idempotency: check for prior event with the same key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies
  const priorRow: AuditEventEntry | null = await (prisma as any).inventoryAuditEvent.findFirst({
    where: {
      shopId: safeShop,
      referenceId: parsed.data.idempotencyKey,
      type: "adjustment",
    },
  });

  if (priorRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies
    const allRows: AuditEventEntry[] = await (prisma as any).inventoryAuditEvent.findMany({
      where: {
        shopId: safeShop,
        referenceId: parsed.data.idempotencyKey,
        type: "adjustment",
      },
    });
    const items: StockAdjustmentItemResult[] = allRows.map((r) => ({
      sku: r.sku,
      productId: r.sku,
      variantAttributes: {},
      delta: r.quantityDelta,
      previousQuantity: 0,
      nextQuantity: 0,
      reason: adjustmentReasonSchema.parse("manual_recount"),
    }));
    const report: StockAdjustmentReport = {
      shop: safeShop,
      idempotencyKey: parsed.data.idempotencyKey,
      dryRun: false,
      adjustedAt: priorRow.createdAt.toISOString(),
      ...(priorRow.note ? { note: priorRow.note } : {}),
      created: 0,
      updated: allRows.length,
      items,
    };
    const event: StockAdjustmentEvent = stockAdjustmentEventSchema.parse({
      id: priorRow.id,
      idempotencyKey: parsed.data.idempotencyKey,
      shop: safeShop,
      adjustedAt: priorRow.createdAt.toISOString(),
      ...(priorRow.note ? { note: priorRow.note } : {}),
      items: parsed.data.items.map((i) => ({
        sku: i.sku,
        productId: i.productId,
        quantity: i.quantity,
        variantAttributes: i.variantAttributes ?? {},
        reason: adjustmentReasonSchema.parse(i.reason),
      })),
      report: { created: 0, updated: allRows.length, items },
    });
    return { ok: true, duplicate: true, report, event };
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

  const eventId = ulid();
  const event: StockAdjustmentEvent = stockAdjustmentEventSchema.parse({
    id: eventId,
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

  // Write per-item audit rows
  await Promise.all(
    results.map((r) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies
      (prisma as any).inventoryAuditEvent.create({
        data: {
          shopId: safeShop,
          type: "adjustment",
          sku: r.sku,
          variantKey: variantKey(r.sku, r.variantAttributes),
          quantityDelta: r.delta,
          referenceId: parsed.data.idempotencyKey,
          note: parsed.data.note ?? null,
          operatorId: null,
        },
      }),
    ),
  );

  return { ok: true, duplicate: false, report, event };
}
