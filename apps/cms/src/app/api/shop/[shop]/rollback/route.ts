import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { join } from "path";
import { promisify } from "util";

import { requirePermission } from "@acme/auth";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> }
) {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
    try {
      const { shop } = await params;
      const root = join(process.cwd(), "..", "..");
      const run = promisify(execFile);
      await run("pnpm", ["ts-node", "scripts/src/rollback-shop.ts", shop], {
        cwd: root,
      });
      return NextResponse.json({ status: "ok" });
    } catch (err) {
    console.error("Rollback failed", err);
    return NextResponse.json({ error: "Rollback failed" }, { status: 500 });
  }
}
