// packages/platform-core/repositories/rentalOrders.server.ts

import "server-only";

import type { RentalOrder } from "@types";
import { validateShopName } from "../shops";
import {
  createOrder,
  listOrders,
  setRefunded,
  setReturned,
} from "../orders";

export async function readOrders(shop: string): Promise<RentalOrder[]> {
  shop = validateShopName(shop);
  return listOrders(shop);
}

export async function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  customerId?: string
): Promise<RentalOrder> {
  shop = validateShopName(shop);
  return createOrder(shop, sessionId, deposit, expectedReturnDate, customerId);
}

export async function markReturned(
  shop: string,
  sessionId: string,
  damageFee?: number
): Promise<RentalOrder | null> {
  shop = validateShopName(shop);
  return setReturned(shop, sessionId, damageFee);
}

export async function markRefunded(
  shop: string,
  sessionId: string
): Promise<RentalOrder | null> {
  shop = validateShopName(shop);
  return setRefunded(shop, sessionId);
}
