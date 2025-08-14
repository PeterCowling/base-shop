import "server-only";

import {
  inventoryItemSchema,
  type InventoryItem,
  type SerializedInventoryItem,
} from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import type Database from "better-sqlite3";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";

interface SqliteInventoryRow {
  sku: string;
  variantAttributes: string | null;
  quantity: number;
}

let DatabaseConstructor: typeof Database;

async function getDb(shop: string): Promise<Database> {
  if (!DatabaseConstructor) {
    ({ default: DatabaseConstructor } = await import("better-sqlite3"));
  }
  shop = validateShopName(shop);
  const dir = path.join(DATA_ROOT, shop);
  await fs.mkdir(dir, { recursive: true });
  const db: Database = new DatabaseConstructor(path.join(dir, "inventory.sqlite"));
  db.exec(
    "CREATE TABLE IF NOT EXISTS inventory (sku TEXT, variantAttributes TEXT, quantity INTEGER, PRIMARY KEY (sku, variantAttributes))",
  );
  return db;
}

async function read(shop: string): Promise<InventoryItem[]> {
  const db: Database = await getDb(shop);
  const rows = db
    .prepare<[], SqliteInventoryRow>(
      "SELECT sku, variantAttributes, quantity FROM inventory",
    )
    .all();
  return rows.map((r) => ({
    sku: r.sku,
    quantity: r.quantity,
    variantAttributes: JSON.parse(r.variantAttributes ?? "{}"),
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
    )
    .map((i) => ({
      sku: i.sku,
      quantity: i.quantity,
      variantAttributes: i.variantAttributes,
    })) as SerializedInventoryItem[];
  const db: Database = await getDb(shop);
  const insert = db.prepare(
    "REPLACE INTO inventory (sku, variantAttributes, quantity) VALUES (?, ?, ?)",
  );
  const tx = db.transaction((records: SerializedInventoryItem[]) => {
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

export async function updateInventoryItem(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
): Promise<InventoryItem | undefined> {
  const db: Database = await getDb(shop);
  const key = JSON.stringify(variantAttributes || {});
  const tx = db
    .transaction(() => {
      const row = db
        .prepare<[string, string], SqliteInventoryRow>(
          "SELECT sku, variantAttributes, quantity FROM inventory WHERE sku = ? AND variantAttributes = ?",
        )
        .get(sku, key);
      const current: InventoryItem | undefined = row
        ? {
            sku: row.sku,
            quantity: row.quantity,
            variantAttributes: JSON.parse(row.variantAttributes ?? "{}"),
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
    })
    .immediate;
  return tx();
}

export const sqliteInventoryRepository: InventoryRepository = {
  read,
  write,
  update: updateInventoryItem,
};

