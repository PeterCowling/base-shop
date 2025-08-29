import "server-only";

import {
  inventoryItemSchema,
  type InventoryItem,
  type SerializedInventoryItem,
} from "@acme/types";
import { promises as fs } from "fs";
import * as path from "path";
import { validateShopName } from "../shops/index";
import { DATA_ROOT } from "../dataRoot";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";
import type Database from "better-sqlite3";

interface SqliteInventoryRow {
  sku: string;
  productId?: string;
  variantAttributes: string | null;
  quantity: number;
  lowStockThreshold: number | null;
  wearCount: number | null;
  wearAndTearLimit: number | null;
  maintenanceCycle: number | null;
}

let DatabaseConstructor: typeof Database | undefined;

async function getDb(shop: string): Promise<Database> {
  if (!DatabaseConstructor) {
    ({ default: DatabaseConstructor } = await import(
      /* webpackIgnore: true */ "better-sqlite3"
    ));
  }
  const ctor = DatabaseConstructor!;
  shop = validateShopName(shop);
  const dir = path.join(DATA_ROOT, shop);
  await fs.mkdir(dir, { recursive: true });
  const db = new ctor(path.join(dir, "inventory.sqlite"));
  db.exec(
    "CREATE TABLE IF NOT EXISTS inventory (sku TEXT, productId TEXT, variantAttributes TEXT, quantity INTEGER, lowStockThreshold INTEGER, wearCount INTEGER, wearAndTearLimit INTEGER, maintenanceCycle INTEGER, PRIMARY KEY (sku, variantAttributes))",
  );
  return db;
}

async function read(shop: string): Promise<InventoryItem[]> {
  const db = await getDb(shop);
  const rows = db
    .prepare(
      "SELECT sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle FROM inventory",
    )
    .all() as SqliteInventoryRow[];
  return rows.map(
    (r: SqliteInventoryRow) =>
      ({
        sku: r.sku,
        quantity: r.quantity,
        variantAttributes: JSON.parse(r.variantAttributes ?? "{}") as Record<
          string,
          string
        >,
        ...(r.productId !== undefined && { productId: r.productId }),
        ...(r.lowStockThreshold !== null && {
          lowStockThreshold: r.lowStockThreshold,
        }),
        ...(r.wearCount !== null && { wearCount: r.wearCount }),
        ...(r.wearAndTearLimit !== null && {
          wearAndTearLimit: r.wearAndTearLimit,
        }),
        ...(r.maintenanceCycle !== null && {
          maintenanceCycle: r.maintenanceCycle,
        }),
      } as InventoryItem),
  );
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
      productId: i.productId,
      quantity: i.quantity,
      variantAttributes: i.variantAttributes,
      lowStockThreshold: i.lowStockThreshold,
      wearCount: i.wearCount,
      wearAndTearLimit: i.wearAndTearLimit,
      maintenanceCycle: i.maintenanceCycle,
    })) as SerializedInventoryItem[];
  const db = await getDb(shop);
  const insert = db.prepare(
    "REPLACE INTO inventory (sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  );
  const tx = db.transaction((...records: unknown[]) => {
    const [items] = records as [SerializedInventoryItem[]];
    db.prepare("DELETE FROM inventory").run();
    for (const item of items) {
      insert.run(
        item.sku,
        item.productId,
        JSON.stringify(item.variantAttributes || {}),
        item.quantity,
        item.lowStockThreshold ?? null,
        item.wearCount ?? null,
        item.wearAndTearLimit ?? null,
        item.maintenanceCycle ?? null,
      );
    }
  }) as (records: SerializedInventoryItem[]) => void;
  tx(normalized);
}

export async function updateInventoryItem(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
): Promise<InventoryItem | undefined> {
  const db = await getDb(shop);
  const key = JSON.stringify(variantAttributes || {});
  const tx = db
    .transaction(() => {
      const row = db
        .prepare(
          "SELECT sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle FROM inventory WHERE sku = ? AND variantAttributes = ?",
        )
        .get(sku, key) as SqliteInventoryRow | undefined;
      const current = row
        ? ({
            sku: row.sku,
            productId: row.productId,
            quantity: row.quantity,
            variantAttributes: JSON.parse(row.variantAttributes ?? "{}"),
            ...(row.lowStockThreshold !== null && {
              lowStockThreshold: row.lowStockThreshold,
            }),
            ...(row.wearCount !== null && { wearCount: row.wearCount }),
            ...(row.wearAndTearLimit !== null && {
              wearAndTearLimit: row.wearAndTearLimit,
            }),
            ...(row.maintenanceCycle !== null && {
              maintenanceCycle: row.maintenanceCycle,
            }),
          } as InventoryItem)
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
        "REPLACE INTO inventory (sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        sku,
        nextItem.productId,
        key,
        nextItem.quantity,
        nextItem.lowStockThreshold ?? null,
        nextItem.wearCount ?? null,
        nextItem.wearAndTearLimit ?? null,
        nextItem.maintenanceCycle ?? null,
      );
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

