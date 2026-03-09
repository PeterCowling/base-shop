import { type NextRequest, NextResponse } from "next/server";

import { inventoryRepository } from "@acme/platform-core/repositories/inventory.server";
import { inventoryItemSchema } from "@acme/platform-core/types/inventory";
import {
  expandInventoryItem,
  type RawInventoryItem,
} from "@acme/platform-core/utils/inventory";

import { apiError } from "../../../../../lib/api-helpers";

export const runtime = "nodejs";

/**
 * Parse a simple CSV string into an array of objects keyed by header.
 * Handles quoted fields but not multi-line values (sufficient for inventory CSVs).
 */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
  if (nonEmpty.length < 2) return [];

  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field
        i++;
        let value = "";
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            value += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++;
            break;
          } else {
            value += line[i];
            i++;
          }
        }
        fields.push(value);
        if (line[i] === ",") i++;
      } else {
        const end = line.indexOf(",", i);
        if (end === -1) {
          fields.push(line.slice(i));
          break;
        }
        fields.push(line.slice(i, end));
        i = end + 1;
      }
    }
    return fields;
  }

  const headers = parseLine(nonEmpty[0] ?? "");
  return nonEmpty.slice(1).map((line) => {
    const values = parseLine(line);
    return Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? ""]));
  });
}

type RowResult = { row: number; status: "ok" | "error"; error?: string; sku?: string };

function validateRows(
  rows: Record<string, string>[],
): { valid: ReturnType<typeof expandInventoryItem>[]; results: RowResult[] } {
  const valid: ReturnType<typeof expandInventoryItem>[] = [];
  const results: RowResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as RawInventoryItem;
    try {
      const item = expandInventoryItem(row);
      valid.push(item);
      results.push({ row: i + 1, status: "ok", sku: item.sku });
    } catch (err) {
      results.push({
        row: i + 1,
        status: "error",
        error: err instanceof Error ? err.message : "Invalid row",
        sku: typeof row.sku === "string" ? row.sku : undefined,
      });
    }
  }
  return { valid, results };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "true";

  try {
    const contentType = req.headers.get("content-type") ?? "";
    let rows: Record<string, string>[] = [];
    let isJson = false;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
      }
      const text = await file.text();
      const fname = (file as File).name ?? "";
      if (fname.endsWith(".json") || contentType.includes("json")) {
        const data = JSON.parse(text) as unknown;
        const arr = Array.isArray(data) ? data : [data];
        rows = arr as Record<string, string>[];
        isJson = true;
      } else {
        rows = parseCsv(text);
      }
    } else if (contentType.includes("application/json")) {
      const body = await req.json() as unknown;
      const arr = Array.isArray(body) ? body : [body];
      rows = arr as Record<string, string>[];
      isJson = true;
    } else {
      // Assume CSV text body
      const text = await req.text();
      rows = parseCsv(text);
    }

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "No rows found in file" }, { status: 400 });
    }

    // For JSON input, rows may already be expanded InventoryItem objects
    let results: RowResult[];
    let validItems: ReturnType<typeof expandInventoryItem>[];

    if (isJson) {
      const parsed = inventoryItemSchema.array().safeParse(rows);
      if (!parsed.success) {
        return NextResponse.json(
          { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") },
          { status: 400 },
        );
      }
      validItems = parsed.data;
      results = validItems.map((item, idx) => ({ row: idx + 1, status: "ok" as const, sku: item.sku }));
    } else {
      const validated = validateRows(rows);
      validItems = validated.valid;
      results = validated.results;
    }

    const errorCount = results.filter((r) => r.status === "error").length;

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        totalRows: rows.length,
        validRows: validItems.length,
        errorRows: errorCount,
        results,
      });
    }

    if (errorCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: `${errorCount} row(s) failed validation. Commit blocked.`,
          totalRows: rows.length,
          errorRows: errorCount,
          results,
        },
        { status: 400 },
      );
    }

    await inventoryRepository.write(shop, validItems);

    return NextResponse.json({
      ok: true,
      dryRun: false,
      totalRows: rows.length,
      importedRows: validItems.length,
      results,
    });
  } catch (err) {
    return apiError(err);
  }
}
