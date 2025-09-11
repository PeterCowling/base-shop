import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import type { Shop } from "@acme/types";
import { trackOrder } from "../analytics";
import { prisma } from "../db";
import { incrementSubscriptionUsage } from "../subscriptionUsage";
import { Order, normalize } from "./utils";

export async function listOrders(shop: string): Promise<Order[]> {
  const orders = (await prisma.rentalOrder.findMany({
    where: { shop },
  })) as Order[];
  return orders.map((order) => normalize(order));
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
  flaggedForReview?: boolean,
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

export async function getOrdersForCustomer(
  shop: string,
  customerId: string,
): Promise<Order[]> {
  const orders = (await prisma.rentalOrder.findMany({
    where: { shop, customerId },
  })) as Order[];
  return orders.map((order) => normalize(order));
}

