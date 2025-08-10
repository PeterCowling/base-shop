// packages/platform-core/repositories/rentalOrders.server.ts

import "server-only";

import { rentalOrderSchema, type RentalOrder } from "@types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ulid } from "ulid";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";
import { nowIso } from "@shared/date";

function ordersPath(shop: string): string {
  shop = validateShopName(shop);

  return path.join(DATA_ROOT, shop, "rental_orders.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);

  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

export async function readOrders(shop: string): Promise<RentalOrder[]> {
  try {
    const buf = await fs.readFile(ordersPath(shop), "utf8");
    const parsed = rentalOrderSchema.array().safeParse(JSON.parse(buf));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function writeOrders(
  shop: string,
  orders: RentalOrder[]
): Promise<void> {
  await ensureDir(shop);
  const tmp = `${ordersPath(shop)}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(orders, null, 2), "utf8");
  await fs.rename(tmp, ordersPath(shop));
}

export async function addOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string
): Promise<RentalOrder> {
  const orders = await readOrders(shop);
  const order: RentalOrder = {
    id: ulid(),
    sessionId,
    shop,
    deposit,
    expectedReturnDate,
    startedAt: nowIso(),
  };
  orders.push(order);
  await writeOrders(shop, orders);
  return order;
}

export async function markReturned(
  shop: string,
  sessionId: string,
  damageFee?: number
): Promise<RentalOrder | null> {
  const orders = await readOrders(shop);
  const idx = orders.findIndex((o) => o.sessionId === sessionId);
  if (idx === -1) return null;
  orders[idx].returnedAt = nowIso();
  if (typeof damageFee === "number") {
    orders[idx].damageFee = damageFee;
  }
  await writeOrders(shop, orders);
  return orders[idx];
}

export async function markRefunded(
  shop: string,
  sessionId: string
): Promise<RentalOrder | null> {
  const orders = await readOrders(shop);
  const idx = orders.findIndex((o) => o.sessionId === sessionId);
  if (idx === -1) return null;
  orders[idx].refundedAt = nowIso();
  await writeOrders(shop, orders);
  return orders[idx];
}
