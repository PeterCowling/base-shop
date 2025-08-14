import "server-only";

import { inventoryItemSchema, type InventoryItem } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";

let Database: any;

async function getDb(shop: string) {
  if (!Database) {
    ({ default: Database } = await import("better-sqlite3"));
  }
  shop = validateShopName(shop);
  const dir = path.join(DATA_ROOT, shop);
  await fs.mkdir(dir, { recursive: true });
  const db = new Database(path.join(dir, "inventory.sqlite"));
  db.exec(
    "CREATE TABLE IF NOT EXISTS inventory (sku TEXT, variantAttributes TEXT, quantity INTEGER, PRIMARY KEY (sku, variantAttributes))",
  );
  return db;
}

async function read(shop: string): Promise<InventoryItem[]> {
  const db = await getDb(shop);
  const rows = db
    .prepare("SELECT sku, variantAttributes, quantity FROM inventory")
    .all();
  return rows.map((r: any) => ({
    sku: r.sku,
    quantity: r.quantity,
    variantAttributes: JSON.parse(r.variantAttributes || "{}"),
  }));
}

async function write(shop: string, items: InventoryItem[]): Promise<void> {
  const normalized = inventoryItemSchema
    .array()
    .parse(
      items.map((i) => ({
        ...i,
        variantAttributes: { ...i.variantAttributes },
      })),
    );
  const db = await getDb(shop);
  const insert = db.prepare(
    "REPLACE INTO inventory (sku, variantAttributes, quantity) VALUES (?, ?, ?)",
  );
  const tx = db.transaction((records: InventoryItem[]) => {
    db.prepare("DELETE FROM inventory").run();
    for (const item of records) {
      insert.run(
        item.sku,
        JSON.stringify(item.variantAttributes || {}),
        item.quantity,
      );
    }
  });
  tx(normalized);
}

async function update(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
): Promise<InventoryItem | undefined> {
  const db = await getDb(shop);
  const key = JSON.stringify(variantAttributes || {});
  const row = db
    .prepare(
      "SELECT sku, variantAttributes, quantity FROM inventory WHERE sku = ? AND variantAttributes = ?",
    )
    .get(sku, key);
  const current: InventoryItem | undefined = row
    ? {
        sku: row.sku,
        quantity: row.quantity,
        variantAttributes: JSON.parse(row.variantAttributes || "{}"),
      }
    : undefined;
  const updated = mutate(current);
  if (updated === undefined) {
    db.prepare(
      "DELETE FROM inventory WHERE sku = ? AND variantAttributes = ?",
    ).run(sku, key);
    return undefined;
  }
  const nextItem = inventoryItemSchema.parse({
    ...current,
    ...updated,
    sku,
    variantAttributes,
  });
  db.prepare(
    "REPLACE INTO inventory (sku, variantAttributes, quantity) VALUES (?, ?, ?)",
  ).run(sku, key, nextItem.quantity);
  return nextItem;
}

export const sqliteInventoryRepository: InventoryRepository = {
  read,
  write,
  update,
};

