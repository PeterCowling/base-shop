import "server-only";

import { ulid } from "ulid";

import { nowIso } from "@acme/date-utils";
import type { Shop } from "@acme/types";

import { trackOrder } from "../analytics";
import { prisma } from "../db";
import { incrementSubscriptionUsage } from "../subscriptionUsage";

import type { Order } from "./utils";
import { normalize } from "./utils";

function isPrismaUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DS-0001 Prisma error is intentionally treated as an untyped runtime value
    (err as any).code === "P2002"
  );
}

export async function listOrders(shop: string): Promise<Order[]> {
  const orders = (await prisma.rentalOrder.findMany({
    where: { shop },
  })) as Order[];
  return orders.map((order) => normalize(order));
}

export const readOrders = listOrders;

export async function getOrderById(shop: string, orderId: string): Promise<Order | null> {
  const order = (await prisma.rentalOrder.findFirst({
    where: { shop, id: orderId },
  })) as Order | null;
  return order ? normalize(order) : null;
}

export type AddOrderInput = {
  orderId?: string;
  shop: string;
  sessionId: string;
  deposit: number;
  expectedReturnDate?: string;
  returnDueDate?: string;
  customerId?: string;
  riskLevel?: string;
  riskScore?: number;
  flaggedForReview?: boolean;
  currency?: string;
  subtotalAmount?: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  cartId?: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeBalanceTransactionId?: string;
  stripeCustomerId?: string;
  lineItems?: {
    sku: string;
    productId?: string;
    variantAttributes?: Record<string, string>;
    quantity?: number;
  }[];
};

export async function addOrder(
  input: AddOrderInput,
): Promise<Order> {
  const {
    orderId,
    shop,
    sessionId,
    deposit,
    expectedReturnDate,
    returnDueDate,
    customerId,
    riskLevel,
    riskScore,
    flaggedForReview,
    currency,
    subtotalAmount,
    taxAmount,
    shippingAmount,
    discountAmount,
    totalAmount,
    cartId,
  stripePaymentIntentId,
  stripeChargeId,
  stripeBalanceTransactionId,
  stripeCustomerId,
  lineItems,
} = input;

  const order: Order = {
    id: orderId ?? ulid(),
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
    ...(currency ? { currency } : {}),
    ...(typeof subtotalAmount === "number" ? { subtotalAmount } : {}),
    ...(typeof taxAmount === "number" ? { taxAmount } : {}),
    ...(typeof shippingAmount === "number" ? { shippingAmount } : {}),
    ...(typeof discountAmount === "number" ? { discountAmount } : {}),
    ...(typeof totalAmount === "number" ? { totalAmount } : {}),
    ...(cartId ? { cartId } : {}),
    ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
    ...(stripeChargeId ? { stripeChargeId } : {}),
    ...(stripeBalanceTransactionId ? { stripeBalanceTransactionId } : {}),
    ...(stripeCustomerId ? { stripeCustomerId } : {}),
    ...(lineItems
      ? {
          lineItems: lineItems.map((li) => ({
            sku: li.sku,
            productId: li.productId,
            variantAttributes: li.variantAttributes ?? {},
            quantity: li.quantity ?? 1,
          })),
        }
      : {}),
  };
  try {
    // cast to any to remain forward-compatible with Prisma client until migrations are applied
    await prisma.rentalOrder.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CORE-0001 [ttl=2026-12-31] Prisma client typings drift during migration window
      data: order as any,
    });
  } catch (err) {
    if (isPrismaUniqueConstraintError(err)) {
      const updated = (await prisma.rentalOrder.update({
        where: { shop_sessionId: { shop, sessionId } },
        data: {
          deposit,
          ...(expectedReturnDate ? { expectedReturnDate } : {}),
          ...(returnDueDate ? { returnDueDate } : {}),
          ...(customerId ? { customerId } : {}),
          ...(riskLevel ? { riskLevel } : {}),
          ...(typeof riskScore === "number" ? { riskScore } : {}),
          ...(typeof flaggedForReview === "boolean" ? { flaggedForReview } : {}),
          ...(currency ? { currency } : {}),
          ...(typeof subtotalAmount === "number" ? { subtotalAmount } : {}),
          ...(typeof taxAmount === "number" ? { taxAmount } : {}),
          ...(typeof shippingAmount === "number" ? { shippingAmount } : {}),
          ...(typeof discountAmount === "number" ? { discountAmount } : {}),
          ...(typeof totalAmount === "number" ? { totalAmount } : {}),
          ...(cartId ? { cartId } : {}),
          ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
          ...(stripeChargeId ? { stripeChargeId } : {}),
          ...(stripeBalanceTransactionId ? { stripeBalanceTransactionId } : {}),
          ...(stripeCustomerId ? { stripeCustomerId } : {}),
          ...(lineItems
            ? {
                lineItems: lineItems.map((li) => ({
                  sku: li.sku,
                  productId: li.productId,
                  variantAttributes: li.variantAttributes ?? {},
                  quantity: li.quantity ?? 1,
                })),
              }
            : {}),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- CORE-0001 [ttl=2026-12-31] Prisma client typings drift during migration window
        } as any,
      })) as Order | null;
      if (updated) return normalize(updated);
    }
    throw err;
  }
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
