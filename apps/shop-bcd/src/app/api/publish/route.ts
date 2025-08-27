import { promises as fs } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { requirePermission } from "@auth";
// The republish utility lives in the top-level scripts directory and isn't
// published as a package. Import it via a relative path so the build can
// resolve it without relying on a workspace alias.
import { republishShop } from "../../../../../../scripts/src/republish-shop";

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
    republishShop(id, root);
    await fs.rm(join(root, "data", "shops", id, "upgrade.json"), { force: true });
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Publish failed", err);
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
