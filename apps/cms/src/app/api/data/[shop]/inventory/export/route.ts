import { type NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";
import { format as formatCsv } from "fast-csv";

import { hasPermission } from "@acme/auth";
import type { Role } from "@acme/auth/types";
import { inventoryRepository } from "@acme/platform-core/repositories/inventory.server";
import { flattenInventoryItem } from "@acme/platform-core/utils/inventory";

/**
 * Sanitize cell values for CSV formula injection protection.
 * Prefixes values starting with =, +, -, @, \t, \r with a single quote.
 */
function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Prevent formula injection - Excel/Sheets treat these as formula starters
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

function sanitizeRow(row: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeCsvValue(value);
  }
  return sanitized;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role as Role | undefined;
  if (!role || !hasPermission(role, "manage_inventory")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { shop } = await context.params;
    const items = await inventoryRepository.read(shop);
    const format = new URL(req.url).searchParams.get("format");
    if (format === "csv") {
      const csv = await new Promise<string>((resolve, reject) => {
        const chunks: string[] = [];
        const stream = formatCsv({ headers: true });
        stream
          .on("error", reject)
          .on("data", (c) => chunks.push(c.toString()))
          .on("end", () => resolve(chunks.join("")));
        items.map(flattenInventoryItem).map(sanitizeRow).forEach((i) => stream.write(i));
        stream.end();
      });
      return new Response(csv, {
        headers: { "content-type": "text/csv" },
      });
    }
    const json = items.map((i: typeof items[number]) => flattenInventoryItem(i));
    return NextResponse.json(json);
  } catch (err) {
    console.error("Inventory export failed", err); // i18n-exempt -- non-UX log
    const message = (err as Error).message;
    const status = /delegate is unavailable/i.test(message) ? 503 : 400;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
