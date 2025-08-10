import Database from "better-sqlite3";
import path from "node:path";
import { DATA_ROOT } from "./dataRoot";
import { ulid } from "ulid";
import { nowIso } from "@shared/date";
import type { RentalOrder } from "@types";
import { trackOrder } from "./analytics";

const dbPath = path.join(DATA_ROOT, "..", "orders.sqlite");
const db = new Database(dbPath);

// Ensure table exists
// id: ulid, sessionId: string, shop: string, deposit: number, expectedReturnDate: string?,
// customerId: string?, startedAt, returnedAt?, refundedAt?, damageFee?
db.exec(`CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  sessionId TEXT NOT NULL,
  shop TEXT NOT NULL,
  deposit REAL NOT NULL,
  expectedReturnDate TEXT,
  customerId TEXT,
  startedAt TEXT NOT NULL,
  returnedAt TEXT,
  refundedAt TEXT,
  damageFee REAL
)`);

export async function createOrder(
  shop: string,
  sessionId: string,
  deposit: number,
  expectedReturnDate?: string,
  customerId?: string
): Promise<RentalOrder> {
  const order: RentalOrder = {
    id: ulid(),
    sessionId,
    shop,
    deposit,
    expectedReturnDate,
    startedAt: nowIso(),
    ...(customerId ? { customerId } : {}),
  };
  const stmt = db.prepare(
    `INSERT INTO orders (id, sessionId, shop, deposit, expectedReturnDate, customerId, startedAt)
     VALUES (@id, @sessionId, @shop, @deposit, @expectedReturnDate, @customerId, @startedAt)`
  );
  stmt.run(order);
  await trackOrder(shop, order.id, deposit);
  return order;
}

export async function listOrders(shop: string): Promise<RentalOrder[]> {
  const stmt = db.prepare(`SELECT * FROM orders WHERE shop = ? ORDER BY startedAt DESC`);
  return stmt.all(shop) as RentalOrder[];
}

export async function getOrdersForCustomer(
  shop: string,
  customerId: string
): Promise<RentalOrder[]> {
  const stmt = db.prepare(
    `SELECT * FROM orders WHERE shop = ? AND customerId = ? ORDER BY startedAt DESC`
  );
  return stmt.all(shop, customerId) as RentalOrder[];
}

export async function setReturned(
  shop: string,
  sessionId: string,
  damageFee?: number
): Promise<RentalOrder | null> {
  const order = db.prepare(
    `SELECT * FROM orders WHERE shop = ? AND sessionId = ?`
  ).get(shop, sessionId) as RentalOrder | undefined;
  if (!order) return null;
  const returnedAt = nowIso();
  db.prepare(
    `UPDATE orders SET returnedAt = ?, damageFee = COALESCE(?, damageFee) WHERE id = ?`
  ).run(returnedAt, damageFee, order.id);
  return { ...order, returnedAt, damageFee: damageFee ?? order.damageFee };
}

export async function setRefunded(
  shop: string,
  sessionId: string
): Promise<RentalOrder | null> {
  const order = db.prepare(
    `SELECT * FROM orders WHERE shop = ? AND sessionId = ?`
  ).get(shop, sessionId) as RentalOrder | undefined;
  if (!order) return null;
  const refundedAt = nowIso();
  db.prepare(`UPDATE orders SET refundedAt = ? WHERE id = ?`).run(refundedAt, order.id);
  return { ...order, refundedAt };
}
