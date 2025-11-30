// apps/cover-me-pretty/src/app/api/edit-changes/route.ts
import { promises as fs } from "fs";
import path from "path";
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
      path.join(process.cwd(), "edit-changes.json"),
      "utf8"
    );
    const data = JSON.parse(raw);
    const rawComponents = Array.isArray(data.components) ? data.components : [];
    const components = rawComponents.filter(
      (c: { oldChecksum: string; newChecksum: string }) =>
        c.oldChecksum !== c.newChecksum,
    );
    const pages = Array.isArray(data.pages) ? data.pages : [];
    return NextResponse.json({ components, pages });
  } catch {
    return NextResponse.json({ components: [], pages: [] });
  }
}
