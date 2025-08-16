import { promises as fs } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { NextResponse } from "next/server";
import { requirePermission } from "@auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await fs.readFile(join(process.cwd(), "shop.json"), "utf8");
    const { id } = JSON.parse(raw) as { id: string };
    const root = join(process.cwd(), "..", "..");
    const res = spawnSync(
      "pnpm",
      ["ts-node", "scripts/src/republish-shop.ts", id],
      {
        cwd: root,
        stdio: "inherit",
      },
    );
    if (res.status !== 0) {
      throw new Error("Republish failed");
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Publish failed", err);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
