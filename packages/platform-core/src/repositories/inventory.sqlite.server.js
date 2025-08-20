import "server-only";
import { inventoryItemSchema, } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
let DatabaseConstructor;
async function getDb(shop) {
    if (!DatabaseConstructor) {
        ({ default: DatabaseConstructor } = await import("better-sqlite3"));
    }
    shop = validateShopName(shop);
    const dir = path.join(DATA_ROOT, shop);
    await fs.mkdir(dir, { recursive: true });
    const db = new DatabaseConstructor(path.join(dir, "inventory.sqlite"));
    db.exec("CREATE TABLE IF NOT EXISTS inventory (sku TEXT, productId TEXT, variantAttributes TEXT, quantity INTEGER, lowStockThreshold INTEGER, wearCount INTEGER, wearAndTearLimit INTEGER, maintenanceCycle INTEGER, PRIMARY KEY (sku, variantAttributes))");
    return db;
}
async function read(shop) {
    const db = await getDb(shop);
    const rows = db
        .prepare("SELECT sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle FROM inventory")
        .all();
    return rows.map((r) => ({
        sku: r.sku,
        productId: r.productId,
        quantity: r.quantity,
        variantAttributes: JSON.parse(r.variantAttributes ?? "{}"),
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
    }));
}
async function write(shop, items) {
    const normalized = inventoryItemSchema
        .array()
        .parse(items.map((i) => ({
        ...i,
        variantAttributes: { ...i.variantAttributes },
    })))
        .map((i) => ({
        sku: i.sku,
        productId: i.productId,
        quantity: i.quantity,
        variantAttributes: i.variantAttributes,
        lowStockThreshold: i.lowStockThreshold,
        wearCount: i.wearCount,
        wearAndTearLimit: i.wearAndTearLimit,
        maintenanceCycle: i.maintenanceCycle,
    }));
    const db = await getDb(shop);
    const insert = db.prepare("REPLACE INTO inventory (sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    const tx = db.transaction((records) => {
        db.prepare("DELETE FROM inventory").run();
        for (const item of records) {
            insert.run(item.sku, item.productId, JSON.stringify(item.variantAttributes || {}), item.quantity, item.lowStockThreshold ?? null, item.wearCount ?? null, item.wearAndTearLimit ?? null, item.maintenanceCycle ?? null);
        }
    });
    tx(normalized);
}
export async function updateInventoryItem(shop, sku, variantAttributes, mutate) {
    const db = await getDb(shop);
    const key = JSON.stringify(variantAttributes || {});
    const tx = db
        .transaction(() => {
        const row = db
            .prepare("SELECT sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle FROM inventory WHERE sku = ? AND variantAttributes = ?")
            .get(sku, key);
        const current = row
            ? {
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
            }
            : undefined;
        const updated = mutate(current);
        if (updated === undefined) {
            db.prepare("DELETE FROM inventory WHERE sku = ? AND variantAttributes = ?").run(sku, key);
            return undefined;
        }
        const nextItem = inventoryItemSchema.parse({
            ...current,
            ...updated,
            sku,
            variantAttributes,
        });
        db.prepare("REPLACE INTO inventory (sku, productId, variantAttributes, quantity, lowStockThreshold, wearCount, wearAndTearLimit, maintenanceCycle) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(sku, nextItem.productId, key, nextItem.quantity, nextItem.lowStockThreshold ?? null, nextItem.wearCount ?? null, nextItem.wearAndTearLimit ?? null, nextItem.maintenanceCycle ?? null);
        return nextItem;
    })
        .immediate;
    return tx();
}
export const sqliteInventoryRepository = {
    read,
    write,
    update: updateInventoryItem,
};
