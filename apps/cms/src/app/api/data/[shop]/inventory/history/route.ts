import { type NextRequest,NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

import { hasPermission } from "@acme/auth";
import type { Role } from "@acme/auth/types";
import { listOrders } from "@acme/platform-core/orders/creation";
import { listEvents as listReverseLogisticsEvents } from "@acme/platform-core/repositories/reverseLogisticsEvents.server";
import { listStockAdjustments } from "@acme/platform-core/repositories/stockAdjustments.server";
import { listStockInflows } from "@acme/platform-core/repositories/stockInflows.server";
import { variantKey } from "@acme/platform-core/types/inventory";

type InventoryHistoryEntry = {
  source:
    | "inflow"
    | "adjustment"
    | "reverse_logistics"
    | "order_allocation"
    | "order_return";
  id: string;
  idempotencyKey: string | null;
  receivedAt: string;
  note: string | null;
  delta: number | null;
  previousQuantity: number | null;
  nextQuantity: number | null;
  reason: string | null;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!role || !hasPermission(role, "manage_inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const sku = searchParams.get("sku")?.trim();
  if (!sku) {
    return NextResponse.json({ error: "sku is required" }, { status: 400 });
  }

  const variantParam = searchParams.get("variant");
  let variantAttributes: Record<string, string> = {};
  if (variantParam) {
    try {
      const parsed = JSON.parse(variantParam) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        variantAttributes = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>)
            .filter(([, v]) => v !== undefined && v !== null && v !== "")
            .map(([k, v]) => [k, String(v)]),
        );
      }
    } catch {
      return NextResponse.json({ error: "variant must be valid JSON" }, { status: 400 });
    }
  }

  const { shop } = await context.params;
  const targetKey = variantKey(sku, variantAttributes);
  const inflows = await listStockInflows(shop, { limit: 500 });
  const adjustments = await listStockAdjustments(shop, { limit: 500 });
  let reverseLogistics: Awaited<ReturnType<typeof listReverseLogisticsEvents>> = [];
  try {
    reverseLogistics = await listReverseLogisticsEvents(shop);
  } catch {
    reverseLogistics = [];
  }
  let orders: Awaited<ReturnType<typeof listOrders>> = [];
  try {
    orders = await listOrders(shop);
  } catch {
    orders = [];
  }

  const history: InventoryHistoryEntry[] = [
    ...inflows.flatMap<InventoryHistoryEntry>((event) =>
      event.report.items
        .filter((item) => variantKey(item.sku, item.variantAttributes) === targetKey)
        .map((item) => ({
          source: "inflow" as const,
          id: event.id,
          idempotencyKey: event.idempotencyKey ?? null,
          receivedAt: event.receivedAt,
          note: event.note ?? null,
          delta: item.delta,
          previousQuantity: item.previousQuantity,
          nextQuantity: item.nextQuantity,
          reason: null as string | null,
        })),
    ),
    ...adjustments.flatMap<InventoryHistoryEntry>((event) =>
      event.report.items
        .filter((item) => variantKey(item.sku, item.variantAttributes) === targetKey)
        .map((item) => ({
          source: "adjustment" as const,
          id: event.id,
          idempotencyKey: event.idempotencyKey ?? null,
          receivedAt: event.adjustedAt,
          note: event.note ?? null,
          delta: item.delta,
          previousQuantity: item.previousQuantity,
          nextQuantity: item.nextQuantity,
          reason: item.reason,
        })),
    ),
    ...reverseLogistics
      .filter((event) => event.sessionId === sku) // best-effort: sessionId may match sku for rental items
      .map((event) => ({
        source: "reverse_logistics" as const,
        id: event.id ?? event.sessionId ?? event.event,
        idempotencyKey: null as string | null,
        receivedAt: event.createdAt,
        note: event.event,
        delta: null as number | null,
        previousQuantity: null as number | null,
        nextQuantity: null as number | null,
        reason: event.event,
      })),
    ...orders.flatMap<InventoryHistoryEntry>((order) => {
      const entries: InventoryHistoryEntry[] = [];
      for (const li of (order as any).lineItems ?? []) {
        if (variantKey(li.sku, li.variantAttributes) !== targetKey) continue;
        if (order.startedAt) {
          entries.push({
            source: "order_allocation",
            id: `${order.id}-alloc`,
            idempotencyKey: order.sessionId ?? null,
            receivedAt: order.startedAt,
            note: "Order allocation",
            delta: -Math.abs(li.quantity ?? 1),
            previousQuantity: null,
            nextQuantity: null,
            reason: "order",
          });
        }
        if (order.returnReceivedAt) {
          entries.push({
            source: "order_return",
            id: `${order.id}-return`,
            idempotencyKey: order.sessionId ?? null,
            receivedAt: order.returnReceivedAt,
            note: "Order return received",
            delta: Math.abs(li.quantity ?? 1),
            previousQuantity: null,
            nextQuantity: null,
            reason: "return",
          });
        }
      }
      return entries;
    }),
  ].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  return NextResponse.json({ items: history });
}
