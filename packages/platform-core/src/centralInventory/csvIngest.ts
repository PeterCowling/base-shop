import "server-only";

import { Readable } from "stream";

import { importCentralInventory } from "./centralInventory.server";
import type {
  CentralInventoryImportItem,
  CentralInventoryImportResult,
} from "./types";

/**
 * Raw CSV row before transformation.
 * Supports flat columns (sku, productId, quantity) and variant.* prefixed columns.
 */
interface RawCsvRow {
  sku?: string;
  productId?: string;
  quantity?: string;
  lowStockThreshold?: string;
  routeToShops?: string;
  [key: string]: string | undefined;
}

/**
 * Parse CSV text and import items into central inventory.
 *
 * Expected CSV format:
 * ```csv
 * sku,productId,variant.size,variant.color,quantity,lowStockThreshold,routeToShops
 * TSHIRT-001,prod_123,M,blue,100,10,"shop-a,shop-b"
 * ```
 *
 * @param csvText - Raw CSV text with headers
 * @returns Import result with counts and errors
 */
export async function importCentralInventoryFromCsv(
  csvText: string,
): Promise<CentralInventoryImportResult> {
  const { parse } = await import("fast-csv");

  const rows = await parseCsv(csvText, parse);
  const items = rows.map(transformRow);

  return importCentralInventory(items);
}

/**
 * Parse CSV text into raw row objects.
 */
async function parseCsv(
  text: string,
  parse: typeof import("fast-csv").parse,
): Promise<RawCsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: RawCsvRow[] = [];
    Readable.from(text)
      .pipe(parse({ headers: true, ignoreEmpty: true }))
      .on("error", reject)
      .on("data", (row) => rows.push(row as RawCsvRow))
      .on("end", () => resolve(rows));
  });
}

/**
 * Transform a raw CSV row into a CentralInventoryImportItem.
 */
function transformRow(row: RawCsvRow): CentralInventoryImportItem {
  const variantAttributes: Record<string, string> = {};

  // Extract variant.* columns
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("variant.") && value) {
      const attrName = key.slice("variant.".length);
      if (attrName) {
        variantAttributes[attrName] = value;
      }
    }
  }

  // Parse routeToShops (comma-separated list)
  const routeToShops = row.routeToShops
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    sku: row.sku ?? "",
    productId: row.productId ?? "",
    variantAttributes,
    quantity: parseInt(row.quantity ?? "0", 10) || 0,
    lowStockThreshold: row.lowStockThreshold
      ? parseInt(row.lowStockThreshold, 10)
      : undefined,
    routeToShops: routeToShops?.length ? routeToShops : undefined,
  };
}

/**
 * Export central inventory to CSV format.
 *
 * @param items - Central inventory items to export
 * @returns CSV text with headers
 */
export async function exportCentralInventoryToCsv(
  items: Array<{
    sku: string;
    productId: string;
    variantAttributes: Record<string, string>;
    quantity: number;
    lowStockThreshold?: number;
  }>,
): Promise<string> {
  const { format } = await import("fast-csv");

  // Collect all variant attribute keys
  const allVariantKeys = new Set<string>();
  for (const item of items) {
    for (const key of Object.keys(item.variantAttributes)) {
      allVariantKeys.add(key);
    }
  }
  const variantKeys = Array.from(allVariantKeys).sort();

  // Flatten items for CSV
  const flatItems = items.map((item) => {
    const flat: Record<string, string | number> = {
      sku: item.sku,
      productId: item.productId,
      quantity: item.quantity,
    };
    if (item.lowStockThreshold !== undefined) {
      flat.lowStockThreshold = item.lowStockThreshold;
    }
    for (const key of variantKeys) {
      flat[`variant.${key}`] = item.variantAttributes[key] ?? "";
    }
    return flat;
  });

  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    const stream = format({ headers: true });
    stream
      .on("error", reject)
      .on("data", (chunk) => chunks.push(chunk.toString()))
      .on("end", () => resolve(chunks.join("")));

    for (const item of flatItems) {
      stream.write(item);
    }
    stream.end();
  });
}
