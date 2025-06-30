// packages/platform-core/repositories/rentalOrders.server.ts

import "server-only";

import * as fsSync from "node:fs";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ulid } from "ulid";
import type { RentalOrder } from "../../types/dist";
import { validateShopName } from "../shops";

function resolveDataRoot(): string {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, "data", "shops");
    if (fsSync.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "data", "shops");
}

const DATA_ROOT = resolveDataRoot();

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
    return JSON.parse(buf) as RentalOrder[];
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
    startedAt: new Date().toISOString(),
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
  orders[idx].returnedAt = new Date().toISOString();
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
  orders[idx].refundedAt = new Date().toISOString();
  await writeOrders(shop, orders);
  return orders[idx];
}
