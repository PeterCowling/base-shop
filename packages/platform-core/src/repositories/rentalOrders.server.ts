// packages/platform-core/src/repositories/rentalOrders.server.ts
import "server-only";

import type { RentalOrder } from "@acme/types";
import { nowIso } from "@acme/date-utils";
import { prisma } from "../db";

export {
  listOrders as readOrders,
  addOrder,
  getOrdersForCustomer,
} from "../orders/creation";
export { markReturned, setReturnTracking } from "../orders/status";
export { markRefunded } from "../orders/refunds";
export { updateRisk } from "../orders/risk";

type Order = RentalOrder;

/**
 * Read a single order by its ID
 */
export async function readOrderById(
  shop: string,
  orderId: string,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.findFirst({
      where: { shop, id: orderId },
    });
    return order as Order | null;
  } catch {
    return null;
  }
}

/**
 * Read a single order by its Stripe session ID
 */
export async function readOrderBySessionId(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.findFirst({
      where: { shop, sessionId },
    });
    return order as Order | null;
  } catch {
    return null;
  }
}

export async function updateStatus(
  shop: string,
  sessionId: string,
  status: NonNullable<Order["status"]>,
  extra: Record<string, unknown> = {},
): Promise<Order | null> {
  try {
    const data: Record<string, unknown> = { status, ...extra };
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data,
    });
    return order as Order;
  } catch {
    return null;
  }
}

export async function markReceived(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  return updateStatus(shop, sessionId, "received", { returnReceivedAt: nowIso() });
}

export async function markCleaning(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  return updateStatus(shop, sessionId, "cleaning");
}

export async function markRepair(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  return updateStatus(shop, sessionId, "repair");
}

export async function markQa(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  return updateStatus(shop, sessionId, "qa");
}

export async function markAvailable(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  return updateStatus(shop, sessionId, "available");
}

export async function markLateFeeCharged(
  shop: string,
  sessionId: string,
  amount: number,
): Promise<Order | null> {
  try {
    const data: Record<string, unknown> = { lateFeeCharged: amount };
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data,
    });
    return order as Order;
  } catch {
    return null;
  }
}
