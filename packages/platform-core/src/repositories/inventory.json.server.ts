import "server-only";

import { promises as fs } from "fs";
import * as path from "path";

import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops/index";
import {
  type InventoryItem,
  inventoryItemSchema,
  variantKey,
} from "../types/inventory";

import type { InventoryMutateFn,InventoryRepository } from "./inventory.types";

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

async function acquireLock(
  lockFile: string,
  {
    timeoutMs = 5000,
    staleMs = 60_000,
  }: { timeoutMs?: number; staleMs?: number } = {},
): Promise<fs.FileHandle> {
  const start = Date.now();
  while (true) {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
      return await fs.open(lockFile, "wx");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      const elapsed = Date.now() - start;
      if (elapsed >= timeoutMs) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
        const stat = await fs.stat(lockFile).catch(() => undefined);
        const isStale =
          typeof stat?.mtimeMs === "number" &&
          Date.now() - stat.mtimeMs > staleMs;
        if (isStale) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
          await fs.unlink(lockFile).catch(() => {});
          continue;
        }
        throw new Error(
          `Timed out acquiring inventory lock ${lockFile} after ${timeoutMs}ms`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}

function inventoryPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "inventory.json");
}

async function ensureDir(shop: string): Promise<void> {
  shop = validateShopName(shop);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 path uses validated shop and trusted base
  await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
}

let stockAlertModule: Promise<typeof import("../services/stockAlert.server")> | undefined;
type StockAlertModuleExports = typeof import("../services/stockAlert.server");
type StockAlertModuleWithDefault = StockAlertModuleExports & {
  default?: Partial<Pick<StockAlertModuleExports, "checkAndAlert">>;
};

async function triggerStockAlert(
  shop: string,
  items: InventoryItem[],
): Promise<void> {
  if (process.env.SKIP_STOCK_ALERT === "1") return;
  const hasLowStock = items.some(
    (i: InventoryItem) =>
      typeof i.lowStockThreshold === "number" &&
      i.quantity <= i.lowStockThreshold,
  );
  if (!hasLowStock) return;
  try {
    stockAlertModule ??= import("../services/stockAlert.server");
    const mod = (await stockAlertModule) as StockAlertModuleWithDefault;
    const fn =
      typeof mod.checkAndAlert === "function"
        ? mod.checkAndAlert
        : typeof mod.default?.checkAndAlert === "function"
          ? mod.default.checkAndAlert
          : undefined;
    if (!fn) {
      throw new Error("stock alert module missing checkAndAlert export"); // i18n-exempt -- developer error, not user-facing
    }
    await fn(shop, items);
  } catch (err) {
    console.error(`Failed to trigger stock alert for ${shop}`, err);
  }
}

async function read(shop: string): Promise<InventoryItem[]> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
    await fs.writeFile(tmp, JSON.stringify(serialized, null, 2), "utf8");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
    await fs.rename(tmp, inventoryPath(shop));
  } finally {
    await handle.close();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
    await fs.unlink(lockFile).catch(() => {});
  }
  await triggerStockAlert(shop, normalized);
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
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
    await fs.writeFile(tmp, JSON.stringify(serialized, null, 2), "utf8");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 file path built from validated shop and constant filename
    await fs.rename(tmp, inventoryPath(shop));
  } finally {
    await handle.close();
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- DS-000 lock file path is derived from validated shop and constant base
    await fs.unlink(lockFile).catch(() => {});
  }

  await triggerStockAlert(shop, normalized);

  return updated;
}

export const jsonInventoryRepository: InventoryRepository = {
  read,
  write,
  update,
};

// When running under Jest, expose a spyable version of `update` so tests can
// verify that the JSON repository was used as a fallback.
const g = globalThis as unknown as {
  jest?: {
    fn: (
      fn: InventoryRepository["update"],
    ) => InventoryRepository["update"];
  };
};
if (g.jest?.fn) {
  jsonInventoryRepository.update = g.jest.fn(
    jsonInventoryRepository.update,
  );
}
