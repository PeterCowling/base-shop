// packages/platform-core/src/orders.ts
import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@lib/date";
import type { RentalOrder } from "@types";
import { trackOrder } from "./analytics";
import { prisma } from "./db";

type Order = RentalOrder;

export async function listOrders(shop: string): Promise<Order[]> {
  const rows = await prisma.rentalOrder.findMany({
    where: { shopId: shop },
  });
  return rows.map((r) => r.data as Order);
}

export const readOrders = listOrders;

export async function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  customerId?: string
): Promise<Order> {
  const order: Order = {
    id: ulid(),
    sessionId,
    shop,
    deposit,
    expectedReturnDate,
    startedAt: nowIso(),
    ...(customerId ? { customerId } : {}),
  };

  await prisma.rentalOrder.create({
    data: {
      id: order.id,
      shopId: shop,
      sessionId,
      customerId,
      data: order,
    },
  });

  await trackOrder(shop, order.id, deposit);
  return order;
}

export async function markReturned(
  shop: string,
  sessionId: string,
  damageFee?: number
): Promise<Order | null> {
  const rec = await prisma.rentalOrder.findUnique({
    where: { sessionId },
  });
  if (!rec || rec.shopId !== shop) return null;
  const order = rec.data as Order;
  order.returnedAt = nowIso();
  if (typeof damageFee === "number") {
    order.damageFee = damageFee;
  }
  await prisma.rentalOrder.update({
    where: { id: rec.id },
    data: {
      data: order,
    },
  });
  return order;
}

export async function markRefunded(
  shop: string,
  sessionId: string
): Promise<Order | null> {
  const rec = await prisma.rentalOrder.findUnique({
    where: { sessionId },
  });
  if (!rec || rec.shopId !== shop) return null;
  const order = rec.data as Order;
  order.refundedAt = nowIso();
  await prisma.rentalOrder.update({
    where: { id: rec.id },
    data: { data: order },
  });
  return order;
}

export async function getOrdersForCustomer(
  shop: string,
  customerId: string
): Promise<Order[]> {
  const rows = await prisma.rentalOrder.findMany({
    where: { shopId: shop, customerId },
  });
  return rows.map((r) => r.data as Order);
}
