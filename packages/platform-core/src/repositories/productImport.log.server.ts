import "server-only";

import { validateShopName } from "../shops/index";
import {
  type ProductImportEvent,
  productImportEventSchema,
} from "../types/productImport";
import { appendToShop, ensureShopDir, readFromShop } from "../utils/safeFs";

export const PRODUCT_IMPORT_LOG_FILENAME = "product-imports.jsonl";

export async function readAllProductImports(shop: string): Promise<ProductImportEvent[]> {
  shop = validateShopName(shop);
  try {
    const buf = (await readFromShop(
      shop,
      PRODUCT_IMPORT_LOG_FILENAME,
      "utf8",
    )) as string;
    const lines = buf.split("\n").map((line) => line.trim()).filter(Boolean);
    return lines.map((line) =>
      productImportEventSchema.parse(JSON.parse(line) as unknown),
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    console.error(`Failed to read product imports for ${shop}`, err);
    throw err;
  }
}

export async function appendProductImport(
  shop: string,
  event: ProductImportEvent,
): Promise<void> {
  shop = validateShopName(shop);
  await ensureShopDir(shop);
  await appendToShop(
    shop,
    PRODUCT_IMPORT_LOG_FILENAME,
    `${JSON.stringify(event)}\n`,
    "utf8",
  );
}

export async function listProductImports(
  shop: string,
  { limit = 50 }: { limit?: number } = {},
): Promise<ProductImportEvent[]> {
  const safeShop = validateShopName(shop);
  const events = await readAllProductImports(safeShop);
  const sorted = [...events].sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  return sorted.slice(0, Math.max(1, Math.floor(limit)));
}

