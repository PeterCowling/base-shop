import "server-only";

import {
  inventoryItemSchema,
  type InventoryItem,
  variantKey,
} from "../types/inventory";
import { promises as fs } from "fs";
import * as path from "path";
import { validateShopName } from "../shops/index";
import { DATA_ROOT } from "../dataRoot";
import type { InventoryRepository, InventoryMutateFn } from "./inventory.types";

/**
 * Filesystem-backed inventory repository used as a fallback when Prisma is
 * unavailable.
 */
interface RawInventoryItem {
  sku: string;
  productId: string;
  quantity: number;
  /**
   * Historically inventory records used the `variant` field when persisted. The
   * current shape uses `variantAttributes`. Include both here so we can read
   * legacy data while always writing the new format.
   */
  variant?: Record<string, string>;
  variantAttributes?: Record<string, string>;
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
    return raw.map(
      ({ variant, variantAttributes, ...rest }: RawInventoryItem) =>
        inventoryItemSchema.parse({
          ...rest,
          variantAttributes: variantAttributes ?? variant ?? {},
        }),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error(`Failed to read inventory for ${shop}`, err);
    throw err;
  }
}

async function write(shop: string, items: InventoryItem[]): Promise<void> {
  const normalized = inventoryItemSchema.array().parse(
    items.map((i: InventoryItem) => ({
      ...i,
      variantAttributes: { ...i.variantAttributes },
    })),
  );
  const serialized: RawInventoryItem[] = normalized.map(
    ({ variantAttributes, ...rest }: InventoryItem): RawInventoryItem => ({
      ...rest,
      ...(Object.keys(variantAttributes).length
        ? { variantAttributes }
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
  const hasLowStock = normalized.some(
    (i: InventoryItem) =>
      typeof i.lowStockThreshold === "number" &&
      i.quantity <= i.lowStockThreshold,
  );
  if (process.env.SKIP_STOCK_ALERT !== "1" && hasLowStock) {
    // Stock alerts are skipped during build to avoid pulling in email dependencies.
  }
}

async function update(
  shop: string,
  sku: string,
  variantAttributes: Record<string, string>,
  mutate: InventoryMutateFn
): Promise<InventoryItem | undefined> {
  const lockFile = `${inventoryPath(shop)}.lock`;
  await ensureDir(shop);
  let normalized: InventoryItem[] = [];
  const handle = await acquireLock(lockFile);
  let updated: InventoryItem | undefined;
  try {
    let items: InventoryItem[] = [];
    try {
      const buf = await fs.readFile(inventoryPath(shop), "utf8");
      const raw: RawInventoryItem[] = JSON.parse(buf);
      items = raw.map(
        ({ variant, variantAttributes, ...rest }: RawInventoryItem) =>
          inventoryItemSchema.parse({
            ...rest,
            variantAttributes: variantAttributes ?? variant ?? {},
          }),
      );
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }

    const key = variantKey(sku, variantAttributes);
    const idx = items.findIndex(
      (i: InventoryItem) => variantKey(i.sku, i.variantAttributes) === key,
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
      items.map((i: InventoryItem) => ({
        ...i,
        variantAttributes: { ...i.variantAttributes },
      })),
    );
    const serialized: RawInventoryItem[] = normalized.map(
      ({ variantAttributes, ...rest }: InventoryItem): RawInventoryItem => ({
        ...rest,
        ...(Object.keys(variantAttributes).length
          ? { variantAttributes }
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

  const hasLowStock = normalized.some(
    (i: InventoryItem) =>
      typeof i.lowStockThreshold === "number" &&
      i.quantity <= i.lowStockThreshold,
  );
  if (process.env.SKIP_STOCK_ALERT !== "1" && hasLowStock) {
    // Stock alerts are skipped during build to avoid pulling in email dependencies.
  }

  return updated;
}

export const jsonInventoryRepository: InventoryRepository = {
  read,
  write,
  update,
};

// When running under Jest, expose a spyable version of `update` so tests can
// verify that the JSON repository was used as a fallback.
if (typeof (globalThis as any).jest?.fn === "function") {
  jsonInventoryRepository.update = (globalThis as any).jest.fn(
    jsonInventoryRepository.update,
  );
}
