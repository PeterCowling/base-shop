// packages/platform-core/src/orders.ts
import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import type { RentalOrder, TrackingEvent } from "@acme/types";
import type { Prisma } from "@prisma/client";
import { trackOrder } from "./analytics";
import { prisma } from "./db";

type Order = RentalOrder;

export async function listOrders(shop: string): Promise<Order[]> {
  return prisma.rentalOrder.findMany({ where: { shop } });
}

export const readOrders = listOrders;

export async function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  customerId?: string,
  riskLevel?: string,
  riskScore?: number,
  flaggedForReview?: boolean
): Promise<Order> {
  const order: Order = {
    id: ulid(),
    sessionId,
    shop,
    deposit,
    expectedReturnDate,
    startedAt: nowIso(),
    ...(customerId ? { customerId } : {}),
    ...(riskLevel ? { riskLevel } : {}),
    ...(typeof riskScore === "number" ? { riskScore } : {}),
    ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
  };
  await prisma.rentalOrder.create({ data: order });
  await trackOrder(shop, order.id, deposit);
  return order;
}

export async function markReturned(
  shop: string,
  sessionId: string,
  damageFee?: number
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        returnedAt: nowIso(),
        ...(typeof damageFee === "number" ? { damageFee } : {}),
      },
    });
    return order as Order;
  } catch {
    return null;
  }
}

export async function markRefunded(
  shop: string,
  sessionId: string,
  riskLevel?: string,
  riskScore?: number,
  flaggedForReview?: boolean
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        refundedAt: nowIso(),
        ...(riskLevel ? { riskLevel } : {}),
        ...(typeof riskScore === "number" ? { riskScore } : {}),
        ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
      },
    });
    return order as Order;
  } catch {
    return null;
  }
}

export async function updateRisk(
  shop: string,
  sessionId: string,
  riskLevel?: string,
  riskScore?: number,
  flaggedForReview?: boolean
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        ...(riskLevel ? { riskLevel } : {}),
        ...(typeof riskScore === "number" ? { riskScore } : {}),
        ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
      },
    });
    return order as Order;
  } catch {
    return null;
  }
}

export async function updateTrackingEvents(
  shop: string,
  sessionId: string,
  events: TrackingEvent[]
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        trackingEvents: events as unknown as Prisma.JsonArray,
      },
    });
    return order as Order;
  } catch {
    return null;
  }
}

export async function getOrdersForCustomer(
  shop: string,
  customerId: string
): Promise<Order[]> {
  return prisma.rentalOrder.findMany({
    where: { shop, customerId },
  });
}
