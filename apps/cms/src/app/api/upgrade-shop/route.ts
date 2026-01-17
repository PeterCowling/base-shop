import { NextRequest, NextResponse } from "next/server";
import { spawnSync } from "child_process";
import { join } from "path";
import { requirePermission } from "@acme/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await requirePermission("manage_pages");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { shop } = (await req.json()) as { shop?: string };
    if (!shop) {
      return NextResponse.json({ error: "shop required" }, { status: 400 });
    }
    const root = join(process.cwd(), "..", "..");
    const cwd = process.cwd();
    try {
      process.chdir(root);
      const res = spawnSync("pnpm", ["tsx", "scripts/src/upgrade-shop.ts", shop]);
      if (res.status !== 0) {
        throw new Error("upgrade-shop failed");
      }
    } finally {
      process.chdir(cwd);
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Upgrade failed", err);
    return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
  }
}
