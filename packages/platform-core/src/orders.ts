// packages/platform-core/src/orders.ts
import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@shared/date";
import type { RentalOrder } from "@types";
import { trackOrder } from "./analytics";

// TODO: Replace in-memory store with persistent DB (e.g., Prisma + SQLite)
// The current implementation uses an in-memory Map to simulate persistence.

type Order = RentalOrder;

const db = new Map<string, Order[]>();

export async function listOrders(shop: string): Promise<Order[]> {
  return db.get(shop) ?? [];
}

export const readOrders = listOrders;

export async function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  customerId?: string
): Promise<Order> {
  const list = db.get(shop) ?? [];
  const order: Order = {
    id: ulid(),
    sessionId,
    shop,
    deposit,
    expectedReturnDate,
    startedAt: nowIso(),
    ...(customerId ? { customerId } : {}),
  };
  list.push(order);
  db.set(shop, list);
  await trackOrder(shop, order.id, deposit);
  return order;
}

export async function markReturned(
  shop: string,
  sessionId: string,
  damageFee?: number
): Promise<Order | null> {
  const list = db.get(shop) ?? [];
  const order = list.find((o) => o.sessionId === sessionId);
  if (!order) return null;
  order.returnedAt = nowIso();
  if (typeof damageFee === "number") {
    order.damageFee = damageFee;
  }
  return order;
}

export async function markRefunded(
  shop: string,
  sessionId: string
): Promise<Order | null> {
  const list = db.get(shop) ?? [];
  const order = list.find((o) => o.sessionId === sessionId);
  if (!order) return null;
  order.refundedAt = nowIso();
  return order;
}

export async function getOrdersForCustomer(
  shop: string,
  customerId: string
): Promise<Order[]> {
  const list = db.get(shop) ?? [];
  return list.filter((o) => o.customerId === customerId);
}
