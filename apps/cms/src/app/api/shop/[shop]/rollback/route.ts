import { NextResponse } from "next/server";
import { join } from "node:path";
import { requirePermission } from "@auth";
import { rollbackShop } from "../../../../../../../../scripts/src/rollback-shop";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { shop: string } }
) {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { shop } = params;
    const root = join(process.cwd(), "..", "..");
    const cwd = process.cwd();
    try {
      process.chdir(root);
      rollbackShop(shop, root);
    } finally {
      process.chdir(cwd);
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Rollback failed", err);
    return NextResponse.json({ error: "Rollback failed" }, { status: 500 });
  }
}
