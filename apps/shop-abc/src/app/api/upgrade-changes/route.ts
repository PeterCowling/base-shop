// apps/shop-abc/src/app/api/upgrade-changes/route.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { requirePermission } from "@auth";
import { z } from "zod";
import { upgradeComponentSchema } from "@acme/types/upgrade";

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
    const components = z
      .array(upgradeComponentSchema)
      .catch([])
      .parse(data.components)
      .filter((c) => c.oldChecksum == null || c.oldChecksum !== c.newChecksum);
    const pages = z.array(z.string()).catch([]).parse(data.pages);
    return NextResponse.json({ components, pages });
  } catch {
    return NextResponse.json({ components: [], pages: [] });
  }
}
