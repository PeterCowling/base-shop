// packages/platform-core/src/repositories/rentalOrders.server.ts
import "server-only";

import type { RentalOrder } from "@acme/types";
import type { Prisma } from "@prisma/client";
import { nowIso } from "@date-utils";
import { prisma } from "../db";

export {
  listOrders as readOrders,
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
  setReturnTracking,
  setReturnStatus,
} from "../orders";

type Order = RentalOrder;

async function updateStatus(
  shop: string,
  sessionId: string,
  status: NonNullable<Order["status"]>,
  extra: Record<string, unknown> = {},
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: { status, ...extra } as Prisma.RentalOrderUpdateInput,
    });
    return order as Order;
  } catch {
    return null;
  }
}

export const markReceived = (
  shop: string,
  sessionId: string,
): Promise<Order | null> =>
  updateStatus(shop, sessionId, "received", { returnReceivedAt: nowIso() });

export const markCleaning = (
  shop: string,
  sessionId: string,
): Promise<Order | null> => updateStatus(shop, sessionId, "cleaning");

export const markRepair = (
  shop: string,
  sessionId: string,
): Promise<Order | null> => updateStatus(shop, sessionId, "repair");

export const markQa = (
  shop: string,
  sessionId: string,
): Promise<Order | null> => updateStatus(shop, sessionId, "qa");

export const markAvailable = (
  shop: string,
  sessionId: string,
): Promise<Order | null> => updateStatus(shop, sessionId, "available");

export async function markLateFeeCharged(
  shop: string,
  sessionId: string,
  amount: number,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: { lateFeeCharged: amount } as Prisma.RentalOrderUpdateInput,
    });
    return order as Order;
  } catch {
    return null;
  }
}
