import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { inventoryItemSchema } from "@platform-core/types/inventory";
import { inventoryRepository } from "@platform-core/repositories/inventory.server";
import {
  expandInventoryItem,
  type RawInventoryItem,
} from "@platform-core/utils/inventory";
import { parse } from "fast-csv";
import { Readable } from "stream";

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
    let text: string;
    try {
      if (!file || typeof (file as any).arrayBuffer !== "function") {
        throw new Error("no file");
      }
      const buf = await (file as any).arrayBuffer();
      text = new TextDecoder().decode(buf);
    } catch {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    let raw: unknown;
    const f = file as File;
    if (f.type === "application/json" || f.name.endsWith(".json")) {
      const data = JSON.parse(text);
      raw = Array.isArray(data)
        ? data.map((row: RawInventoryItem) => expandInventoryItem(row))
        : expandInventoryItem(data as RawInventoryItem);
    } else {
      const rows: RawInventoryItem[] = await new Promise((resolve, reject) => {
        const collected: RawInventoryItem[] = [];
        Readable.from(text)
          .pipe(parse({ headers: true, ignoreEmpty: true }))
          .on("error", reject)
          .on("data", (row) => {
            collected.push(row as RawInventoryItem);
          })
          .on("end", () => resolve(collected));
      });
      try {
        raw = rows.map((r) => expandInventoryItem(r));
      } catch (err) {
        return NextResponse.json(
          { error: (err as Error).message },
          { status: 400 },
        );
      }
    }
    const parsed = inventoryItemSchema.array().safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }
    const { shop } = await context.params;
    await inventoryRepository.write(shop, parsed.data);
    return NextResponse.json({ success: true, items: parsed.data });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
