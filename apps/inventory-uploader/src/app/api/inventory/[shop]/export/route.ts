import { type NextRequest, NextResponse } from "next/server";

import { inventoryRepository } from "@acme/platform-core/repositories/inventory.server";
import { flattenInventoryItem } from "@acme/platform-core/utils/inventory";

import { apiError } from "../../../../../lib/api-helpers";

export const runtime = "nodejs";

/**
 * Sanitize and properly encode a value for CSV output.
 * Prevents formula injection (prefixes =, +, -, @, tab, CR with a single quote).
 * Quotes fields that contain commas, double quotes, or newlines per RFC 4180.
 */
function sanitizeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(safe)) return `"${safe.replace(/"/g, '""')}"`;
  return safe;
}

function toCsv(items: ReturnType<typeof flattenInventoryItem>[]): string {
  if (items.length === 0) return "";
  // Collect all keys in insertion order, preserving sku, productId, quantity order
  const allKeys = new Set<string>();
  for (const item of items) {
    for (const k of Object.keys(item)) allKeys.add(k);
  }
  // Canonical column order: sku, productId, variant.* (sorted), quantity, lowStockThreshold
  const variantCols = [...allKeys].filter((k) => k.startsWith("variant.")).sort();
  const columns = ["sku", "productId", ...variantCols, "quantity", "lowStockThreshold"].filter(
    (c) => allKeys.has(c),
  );

  const header = columns.map(sanitizeCsv).join(",");
  const rows = items.map((item) => {
    const record = item as Record<string, unknown>;
    return columns.map((c) => sanitizeCsv(record[c])).join(",");
  });
  return [header, ...rows].join("\r\n") + "\r\n";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  const url = new URL(req.url);
  const formatParam = url.searchParams.get("format");
  const acceptHeader = req.headers.get("accept") ?? "";
  const wantCsv =
    formatParam === "csv" || (!formatParam && acceptHeader.includes("text/csv"));

  try {
    const items = await inventoryRepository.read(shop);
    const flat = items.map(flattenInventoryItem);

    if (wantCsv) {
      const date = new Date().toISOString().slice(0, 10);
      const filename = `inventory-${shop}-${date}.csv`;
      return new Response(toCsv(flat), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json(flat);
  } catch (err) {
    return apiError(err);
  }
}
