import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "@platform-core/dataRoot";

/**
 * POST /cms/api/configurator/init-shop
 * Body: { id: string; csv?: string; categories?: string[] }
 * Seeds categories and product CSV for a shop.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id, csv, categories } = (await req.json()) as {
      id: string;
      csv?: string;
      categories?: string[];
    };
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const dir = path.join(resolveDataRoot(), id);
    await fs.mkdir(dir, { recursive: true });
    if (csv) {
      const buf = Buffer.from(csv, "base64");
      await fs.writeFile(path.join(dir, "products.csv"), buf);
    }
    if (categories) {
      await fs.writeFile(
        path.join(dir, "categories.json"),
        JSON.stringify(categories, null, 2),
        "utf8"
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
