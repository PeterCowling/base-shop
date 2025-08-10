// packages/platform-core/src/repositories/rentalOrdersDb.server.ts
import "server-only";
import type { RentalOrder } from "@types";
import { createOrder, getOrdersForCustomer as getOrdersForCustomerDb } from "../orders";

export type CustomerOrder = RentalOrder;

export async function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  customerId?: string
): Promise<CustomerOrder> {
  return createOrder(shop, sessionId, deposit, expectedReturnDate, customerId);
}

export async function getOrdersForCustomer(
  shop: string,
  customerId: string
): Promise<CustomerOrder[]> {
  return getOrdersForCustomerDb(shop, customerId);
}
