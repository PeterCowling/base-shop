// packages/platform-core/src/repositories/rentalOrders.server.ts
import "server-only";

import type { RentalOrder } from "@acme/types";
import { nowIso } from "@acme/date-utils";
import { prisma } from "../db";

export {
  listOrders as readOrders,
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
  setReturnTracking,
} from "../orders";

type Order = RentalOrder;

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
