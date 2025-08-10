// packages/platform-core/src/repositories/rentalOrdersDb.server.ts
import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@shared/date";
import type { RentalOrder } from "@types";

export type CustomerOrder = RentalOrder;

const db = new Map<string, CustomerOrder[]>();

export async function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  customerId?: string
): Promise<CustomerOrder> {
  const list = db.get(shop) ?? [];
  const order: CustomerOrder = {
    id: ulid(),
    sessionId,
    shop,
    deposit,
    expectedReturnDate,
    startedAt: nowIso(),
    ...(customerId ? { customerId } : {}),
  };
  list.push(order);
  db.set(shop, list);
  return order;
}

export async function getOrdersForCustomer(
  shop: string,
  customerId: string
): Promise<CustomerOrder[]> {
  const list = db.get(shop) ?? [];
  return list.filter((o) => o.customerId === customerId);
}
