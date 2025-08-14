// apps/shop-bcd/src/app/api/upgrade-changes/route.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requirePermission } from "@auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "upgrade-changes.json"),
      "utf8"
    );
    const data = JSON.parse(raw);
    const components = Array.isArray(data.components) ? data.components : [];
    const pages = Array.isArray(data.pages) ? data.pages : [];
    return NextResponse.json({ components, pages });
  } catch {
    return NextResponse.json({ components: [], pages: [] });
  }
}
