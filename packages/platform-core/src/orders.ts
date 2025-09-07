// packages/platform-core/src/orders.ts
import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import type { RentalOrder, Shop } from "@acme/types";
import { trackOrder } from "./analytics";
import { prisma } from "./db";
import { incrementSubscriptionUsage } from "./subscriptionUsage";
import { stripe } from "@acme/stripe";

export type Order = RentalOrder;

function normalize<T extends Order>(order: T): T {
  const o = { ...order } as Record<keyof T, T[keyof T]>;
  (Object.keys(o) as Array<keyof T>).forEach((k) => {
    if (o[k] === null) {
      o[k] = undefined as T[keyof T];
    }
  });
  return o as T;
}

export async function listOrders(shop: string): Promise<Order[]> {
  const orders = await prisma.rentalOrder.findMany({ where: { shop } });
  return orders.map(normalize);
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
    startedAt: nowIso(),
    ...(expectedReturnDate ? { expectedReturnDate } : {}),
    ...(returnDueDate ? { returnDueDate } : {}),
    ...(customerId ? { customerId } : {}),
    ...(riskLevel ? { riskLevel } : {}),
    ...(typeof riskScore === "number" ? { riskScore } : {}),
    ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
  };
  await prisma.rentalOrder.create({
    data: order,
  });
  await trackOrder(shop, order.id, deposit);
  if (customerId) {
    const month = nowIso().slice(0, 7);
    const record = await prisma.shop.findUnique({
      select: { data: true },
      where: { id: shop },
    });
    const shopData = record?.data as Shop | undefined;
    if (shopData?.subscriptionsEnabled) {
      await incrementSubscriptionUsage(shop, customerId, month);
    }
  }
  return order;
}

export async function markFulfilled(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { fulfilledAt: nowIso() },
  });
  return order as Order;
}

export async function markShipped(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { shippedAt: nowIso() },
  });
  return order as Order;
}

export async function markDelivered(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { deliveredAt: nowIso() },
  });
  return order as Order;
}

export async function markCancelled(
  shop: string,
  sessionId: string,
): Promise<Order> {
  const order = await prisma.rentalOrder.update({
    where: { shop_sessionId: { shop, sessionId } },
    data: { cancelledAt: nowIso() },
  });
  return order as Order;
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
    return order;
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
    return order;
  } catch {
    return null;
  }
}

export async function refundOrder(
  shop: string,
  sessionId: string,
  amount: number,
): Promise<Order | null> {
  const order = await prisma.rentalOrder.findUnique({
    where: { shop_sessionId: { shop, sessionId } },
  });
  if (!order) return null;

  const alreadyRefunded = (order as any).refundTotal ?? 0;
  const refundable = Math.max(amount - alreadyRefunded, 0);

  if (refundable > 0) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
    const pi =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    if (!pi) {
      throw new Error("payment_intent missing");
    }
    await stripe.refunds.create({
      payment_intent: pi,
      amount: refundable * 100,
    });
  }

  try {
    const updated = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: {
        refundedAt: nowIso(),
        refundTotal: alreadyRefunded + refundable,
      } as any,
    });
    return updated as Order;
  } catch {
    return null;
  }
}

export async function markNeedsAttention(
  shop: string,
  sessionId: string,
): Promise<Order | null> {
  try {
    const order = await prisma.rentalOrder.update({
      where: { shop_sessionId: { shop, sessionId } },
      data: { flaggedForReview: true },
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
    return order;
  } catch {
    return null;
  }
}

export async function getOrdersForCustomer(
  shop: string,
  customerId: string
): Promise<Order[]> {
  const orders = await prisma.rentalOrder.findMany({
    where: { shop, customerId },
  });
  return orders.map(normalize);
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
    return order;
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
    return order;
  } catch {
    return null;
  }
}
