import "server-only";

import { inventoryItemSchema, type InventoryItem } from "@acme/types";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { validateShopName } from "../shops/index.js";
import { DATA_ROOT } from "../dataRoot.js";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types.js";

interface RawInventoryItem {
  sku: string;
  productId: string;
  quantity: number;
  variant?: Record<string, string>;
  lowStockThreshold?: number;
  wearCount?: number;
  wearAndTearLimit?: number;
  maintenanceCycle?: number;
  [key: string]: unknown;
}

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

function inventoryPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

async function read(shop: string): Promise<InventoryItem[]> {
  try {
    const buf = await fs.readFile(inventoryPath(shop), "utf8");
    const raw: RawInventoryItem[] = JSON.parse(buf);
    return raw.map(({ variant, ...rest }) =>
      inventoryItemSchema.parse({
        ...rest,
        variantAttributes: variant ?? {},
      })
    );
  } catch (err) {
    console.error(`Failed to read inventory for ${shop}`, err);
    throw err;
  }
}

async function write(shop: string, items: InventoryItem[]): Promise<void> {
  const normalized = inventoryItemSchema.array().parse(
    items.map((i) => ({
      ...i,
      variantAttributes: { ...i.variantAttributes },
    }))
  );
  const serialized: RawInventoryItem[] = normalized.map(
    ({ variantAttributes, ...rest }): RawInventoryItem => ({
      ...rest,
      ...(Object.keys(variantAttributes).length
        ? { variant: variantAttributes }
        : {}),
    })
  );
  await ensureDir(shop);
  const lockFile = `${inventoryPath(shop)}.lock`;
  const handle = await acquireLock(lockFile);
  try {
    const tmp = `${inventoryPath(shop)}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(serialized, null, 2), "utf8");
    await fs.rename(tmp, inventoryPath(shop));
  } finally {
    await handle.close();
    await fs.unlink(lockFile).catch(() => {});
  }
  try {
    if (process.env.SKIP_STOCK_ALERT !== "1") {
      const { checkAndAlert } = await import("../services/stockAlert.server.js");
      await checkAndAlert(shop, normalized);
    }
  } catch (err) {
    console.error("Failed to run stock alert", err);
  }
}

async function update(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn
): Promise<InventoryItem | undefined> {
  const lockFile = `${inventoryPath(shop)}.lock`;
  let normalized: InventoryItem[] = [];
  const handle = await acquireLock(lockFile);
  let updated: InventoryItem | undefined;
  try {
    let items: InventoryItem[] = [];
    try {
      const buf = await fs.readFile(inventoryPath(shop), "utf8");
      const raw: RawInventoryItem[] = JSON.parse(buf);
      items = raw.map(({ variant, ...rest }) =>
        inventoryItemSchema.parse({
          ...rest,
          variantAttributes: variant ?? {},
        })
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }

    const key = variantKey(sku, variantAttributes);
    const idx = items.findIndex(
      (i) => variantKey(i.sku, i.variantAttributes) === key
    );
    const current = idx === -1 ? undefined : items[idx];
    updated = mutate(current);
    if (updated === undefined) {
      if (idx !== -1) items.splice(idx, 1);
    } else {
      const nextItem = inventoryItemSchema.parse({
        ...current,
        ...updated,
        sku,
        variantAttributes,
      });
      if (idx === -1) items.push(nextItem);
      else items[idx] = nextItem;
    }

    normalized = inventoryItemSchema.array().parse(
      items.map((i) => ({
        ...i,
        variantAttributes: { ...i.variantAttributes },
      }))
    );
    const serialized: RawInventoryItem[] = normalized.map(
      ({ variantAttributes, ...rest }): RawInventoryItem => ({
        ...rest,
        ...(Object.keys(variantAttributes).length
          ? { variant: variantAttributes }
          : {}),
      })
    );

    const tmp = `${inventoryPath(shop)}.${Date.now()}.tmp`;
    await ensureDir(shop);
    await fs.writeFile(tmp, JSON.stringify(serialized, null, 2), "utf8");
    await fs.rename(tmp, inventoryPath(shop));
  } finally {
    await handle.close();
    await fs.unlink(lockFile).catch(() => {});
  }

  try {
    if (process.env.SKIP_STOCK_ALERT !== "1") {
      const { checkAndAlert } = await import("../services/stockAlert.server.js");
      await checkAndAlert(shop, normalized);
    }
  } catch (err) {
    console.error("Failed to run stock alert", err);
  }

  return updated;
}

function variantKey(sku: string, attrs: Record<string, string>): string {
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
