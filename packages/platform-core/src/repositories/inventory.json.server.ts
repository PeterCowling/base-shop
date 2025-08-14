import "server-only";

import { inventoryItemSchema, type InventoryItem } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops";
import { DATA_ROOT } from "../dataRoot";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";

async function acquireLock(lockFile: string): Promise<fs.FileHandle> {
  while (true) {
    try {
      return await fs.open(lockFile, "wx");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      await new Promise((res) => setTimeout(res, 50));
    }
  }
}

function inventoryDir(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory");
}

function itemPath(shop: string, key: string): string {
  return path.join(inventoryDir(shop), `${key}.json`);
}

async function ensureDir(shop: string): Promise<void> {
  await fs.mkdir(inventoryDir(shop), { recursive: true });
}

async function read(shop: string): Promise<InventoryItem[]> {
  try {
    const dir = inventoryDir(shop);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const items = await Promise.all(
      entries
        .filter((e) => e.isFile() && e.name.endsWith(".json"))
        .map(async (e) => {
          const buf = await fs.readFile(path.join(dir, e.name), "utf8");
          const raw = JSON.parse(buf);
          return inventoryItemSchema.parse({
            variantAttributes: {},
            ...raw,
          });
        }),
    );
    return items;
  } catch (err) {
    console.error(`Failed to read inventory for ${shop}`, err);
    throw err;
  }
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
  await ensureDir(shop);
  await Promise.all(
    normalized.map(async (item) => {
      const key = variantKey(item.sku, item.variantAttributes);
      const file = itemPath(shop, key);
      const lockFile = `${file}.lock`;
      const handle = await acquireLock(lockFile);
      try {
        const tmp = `${file}.${Date.now()}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(item, null, 2), "utf8");
        await fs.rename(tmp, file);
      } finally {
        await handle.close();
        await fs.unlink(lockFile).catch(() => {});
      }
    }),
  );
  try {
    if (process.env.SKIP_STOCK_ALERT !== "1") {
      const { checkAndAlert } = await import("../services/stockAlert.server");
      await checkAndAlert(shop, await read(shop));
    }
  } catch (err) {
    console.error("Failed to run stock alert", err);
  }
}

async function update(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn,
): Promise<InventoryItem | undefined> {
  const key = variantKey(sku, variantAttributes);
  const file = itemPath(shop, key);
  await ensureDir(shop);
  const lockFile = `${file}.lock`;
  const handle = await acquireLock(lockFile);
  let updated: InventoryItem | undefined;
  try {
    let current: InventoryItem | undefined;
    try {
      const buf = await fs.readFile(file, "utf8");
      const raw = JSON.parse(buf);
      current = inventoryItemSchema.parse({
        variantAttributes: {},
        ...raw,
      });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }

    updated = mutate(current);
    if (updated === undefined) {
      await fs.unlink(file).catch(() => {});
    } else {
      const nextItem = inventoryItemSchema.parse({
        ...current,
        ...updated,
        sku,
        variantAttributes,
      });
      const tmp = `${file}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(nextItem, null, 2), "utf8");
      await fs.rename(tmp, file);
    }
  } finally {
    await handle.close();
    await fs.unlink(lockFile).catch(() => {});
  }

  try {
    if (process.env.SKIP_STOCK_ALERT !== "1") {
      const { checkAndAlert } = await import("../services/stockAlert.server");
      await checkAndAlert(shop, await read(shop));
    }
  } catch (err) {
    console.error("Failed to run stock alert", err);
  }

  return updated;
}

function variantKey(
  sku: string,
  attrs: Record<string, string>,
): string {
  const variantPart = Object.entries(attrs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  return variantPart ? `${sku}#${variantPart}` : sku;
}

export const jsonInventoryRepository: InventoryRepository = {
  read,
  write,
  update,
};
