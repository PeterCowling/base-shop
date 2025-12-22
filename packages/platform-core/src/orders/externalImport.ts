import "server-only";
import { addOrder } from "./creation";
import type { Order } from "./utils";

export type ExternalOrderPayload = {
  shop: string;
  sessionId: string;
  amountTotal?: number;
  currency?: string;
  paymentIntentId?: string;
  stripeCustomerId?: string;
  cartId?: string;
  orderId?: string;
  internalCustomerId?: string;
};

function safeAmount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return undefined;
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

export async function importExternalOrder(
  payload: ExternalOrderPayload,
): Promise<Order> {
  const {
    shop,
    sessionId,
    amountTotal,
    currency,
    paymentIntentId,
    stripeCustomerId,
    cartId,
    orderId,
    internalCustomerId,
  } = payload;

  const totalAmount = safeAmount(amountTotal) ?? 0;
  const normalizedCurrency = safeString(currency)?.toUpperCase();

  return addOrder({
    shop,
    sessionId,
    orderId,
    deposit: totalAmount,
    totalAmount,
    currency: normalizedCurrency,
    cartId: safeString(cartId),
    customerId: safeString(internalCustomerId),
    stripePaymentIntentId: safeString(paymentIntentId),
    stripeCustomerId: safeString(stripeCustomerId),
  });
}
