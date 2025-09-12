import "server-only";
import { nowIso } from "@acme/date-utils";
import { prisma } from "../db";
import { normalize } from "./utils";
import type { Order } from "./utils";

export async function markFulfilled(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { fulfilledAt: nowIso() },
  });
  return normalize(order as Order);
}

export async function markShipped(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { shippedAt: nowIso() },
  });
  return normalize(order as Order);
}

export async function markDelivered(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { deliveredAt: nowIso() },
  });
  return normalize(order as Order);
}

export async function markCancelled(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { cancelledAt: nowIso() },
  });
  return normalize(order as Order);
}

export async function markReturned(
  shop: string,
  sessionId: string,
  damageFee?: number,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        returnedAt: nowIso(),
        ...(typeof damageFee === "number" ? { damageFee } : {}),
      },
    });
    if (!order) return null;
    return normalize(order as Order);
  } catch {
    return null;
  }
}

export async function setReturnTracking(
  shop: string,
  sessionId: string,
  trackingNumber: string,
  labelUrl: string,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: { trackingNumber, labelUrl },
    });
    if (!order) return null;
    return normalize(order as Order);
  } catch {
    return null;
  }
}

export async function setReturnStatus(
  shop: string,
  trackingNumber: string,
  returnStatus: string,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_trackingNumber: { shop, trackingNumber } },
      data: { returnStatus },
    });
    return normalize(order as Order);
  } catch {
    return null;
  }
}

