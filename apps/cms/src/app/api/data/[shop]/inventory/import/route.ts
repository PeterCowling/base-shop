import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { inventoryItemSchema } from "@types";
import { writeInventory } from "@platform-core/repositories/inventory.server";
import { parse } from "fast-csv";
import { Readable } from "node:stream";

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
      const data = JSON.parse(text);
      raw = Array.isArray(data)
        ? data.map((row: Record<string, unknown>) => {
            const {
              sku,
              productId,
              quantity,
              lowStockThreshold,
              variantAttributes,
              ...rest
            } = row;
            const attrs =
              typeof variantAttributes === "object" && variantAttributes
                ? (variantAttributes as Record<string, string>)
                : Object.fromEntries(
                    Object.entries(rest)
                      .filter(
                        ([k, v]) =>
                          k.startsWith("variant.") &&
                          v !== undefined &&
                          v !== ""
                      )
                      .map(([k, v]) => [k.slice("variant.".length), v as string])
                  );
            return {
              sku: sku as string,
              productId: (productId as string) || (sku as string),
              variantAttributes: attrs,
              quantity: Number(quantity),
              ...(lowStockThreshold !== undefined && lowStockThreshold !== ""
                ? { lowStockThreshold: Number(lowStockThreshold) }
                : {}),
            };
          })
        : data;
    } else {
      raw = await new Promise((resolve, reject) => {
        const rows: unknown[] = [];
        Readable.from(text)
          .pipe(parse({ headers: true, ignoreEmpty: true }))
          .on("error", reject)
          .on("data", (row) => {
            const {
              sku,
              productId,
              quantity,
              lowStockThreshold,
              ...variants
            } = row as Record<string, string>;
            rows.push({
              sku,
              productId: productId || sku,
              variantAttributes: Object.fromEntries(
                Object.entries(variants)
                  .filter(([, v]) => v !== undefined && v !== "")
                  .map(([k, v]) => [k.replace(/^variant\./, ""), v])
              ),
              quantity: Number(quantity),
              ...(lowStockThreshold
                ? { lowStockThreshold: Number(lowStockThreshold) }
                : {}),
            });
          })
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
