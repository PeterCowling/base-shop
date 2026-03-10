import "server-only";

import { ulid } from "ulid";

import { prisma } from "../db";
import { validateShopName } from "../shops/index";
import { type InventoryItem, inventoryItemSchema, variantKey } from "../types/inventory";
import {
  type StockInflowActor,
  type StockInflowEvent,
  stockInflowEventSchema,
  type StockInflowItemResult,
  type StockInflowReport,
  stockInflowRequestSchema,
} from "../types/stockInflows";

import { readInventory, writeInventory } from "./inventory.server";

export type InflowAuditEventEntry = {
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

export type ReceiveStockInflowResult =
  | { ok: true; duplicate: false; report: StockInflowReport; event: StockInflowEvent }
  | { ok: true; duplicate: true; report: StockInflowReport; event: StockInflowEvent }
  | { ok: false; code: string; message: string; details?: unknown };

export async function listStockInflows(
  shop: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<InflowAuditEventEntry[]> {
  const safeShop = validateShopName(shop);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies by generated schema
  return (prisma as any).inventoryAuditEvent.findMany({
    where: { shopId: safeShop, type: "inflow" },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, Math.floor(limit)),
  });
}

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

  // Idempotency: check for prior event with the same key
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies
  const priorRow: InflowAuditEventEntry | null = await (prisma as any).inventoryAuditEvent.findFirst({
    where: {
      shopId: safeShop,
      referenceId: parsed.data.idempotencyKey,
      type: "inflow",
    },
  });

  if (priorRow) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies
    const allRows: InflowAuditEventEntry[] = await (prisma as any).inventoryAuditEvent.findMany({
      where: {
        shopId: safeShop,
        referenceId: parsed.data.idempotencyKey,
        type: "inflow",
      },
    });
    const items: StockInflowItemResult[] = allRows.map((r) => ({
      sku: r.sku,
      productId: r.sku,
      variantAttributes: {},
      delta: r.quantityDelta,
      previousQuantity: 0,
      nextQuantity: r.quantityDelta,
    }));
    const report: StockInflowReport = {
      shop: safeShop,
      idempotencyKey: parsed.data.idempotencyKey,
      dryRun: false,
      receivedAt: priorRow.createdAt.toISOString(),
      ...(priorRow.note ? { note: priorRow.note } : {}),
      created: 0,
      updated: allRows.length,
      items,
    };
    const event: StockInflowEvent = stockInflowEventSchema.parse({
      id: priorRow.id,
      idempotencyKey: parsed.data.idempotencyKey,
      shop: safeShop,
      receivedAt: priorRow.createdAt.toISOString(),
      ...(priorRow.note ? { note: priorRow.note } : {}),
      items: parsed.data.items.map((i) => ({
        sku: i.sku,
        productId: i.productId,
        quantity: i.quantity,
        variantAttributes: i.variantAttributes ?? {},
      })),
      report: { created: 0, updated: allRows.length, items },
    });
    return { ok: true, duplicate: true, report, event };
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

  const eventId = ulid();
  const event: StockInflowEvent = stockInflowEventSchema.parse({
    id: eventId,
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

  // Write per-item audit rows
  await Promise.all(
    results.map((r) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- prisma client type varies
      (prisma as any).inventoryAuditEvent.create({
        data: {
          shopId: safeShop,
          type: "inflow",
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
