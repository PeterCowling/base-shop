import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { inventoryItemSchema } from "@types";
import { writeInventory } from "@platform-core/repositories/inventory.server";
import { parse } from "fast-csv";
import { Readable } from "node:stream";

function normalizeRow(row: Record<string, unknown>) {
  const variantAttributes: Record<string, string> = {};
  // merge existing variantAttributes object if provided
  if (row.variantAttributes && typeof row.variantAttributes === "object") {
    for (const [k, v] of Object.entries(row.variantAttributes as Record<string, unknown>)) {
      if (typeof v === "string") {
        variantAttributes[k] = v;
      }
    }
  }
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("variant.")) {
      variantAttributes[key.slice(8)] = String(value);
    }
  }
  return {
    sku: row.sku as string,
    productId: row.productId as string,
    quantity: Number(row.quantity),
    lowStockThreshold:
      row.lowStockThreshold === undefined || row.lowStockThreshold === ""
        ? undefined
        : Number(row.lowStockThreshold),
    variantAttributes,
  };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file") as unknown;
    if (!file || typeof (file as any).text !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const text = await (file as any).text();
    let raw: unknown;
    if (file.type === "application/json" || file.name.endsWith(".json")) {
      raw = JSON.parse(text);
      if (Array.isArray(raw)) {
        raw = raw.map((row) => normalizeRow(row as Record<string, unknown>));
      }
    } else {
      raw = await new Promise((resolve, reject) => {
        const rows: unknown[] = [];
        Readable.from(text)
          .pipe(parse({ headers: true, ignoreEmpty: true }))
          .on("error", reject)
          .on("data", (row) => rows.push(normalizeRow(row)))
          .on("end", () => resolve(rows));
      });
    }
    const parsed = inventoryItemSchema.array().safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join(", ") },
        { status: 400 }
      );
    }
    const { shop } = await context.params;
    await writeInventory(shop, parsed.data);
    return NextResponse.json({ success: true, items: parsed.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
