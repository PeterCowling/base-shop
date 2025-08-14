// packages/platform-core/src/orders.ts
import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import type { RentalOrder } from "@acme/types";
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
  returnDueDate?: string,
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
    returnDueDate,
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

export async function markReturnReceived(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: { returnReceivedAt: nowIso() },
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

export async function markLateFeeCharged(
  shop: string,
  sessionId: string,
  amount: number,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: { lateFeeCharged: amount },
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

export async function setReturnTracking(
  shop: string,
  sessionId: string,
  trackingNumber: string,
  labelUrl: string
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: { trackingNumber, labelUrl },
    });
    return order as Order;
  } catch {
    return null;
  }
}
