import { promises as fs } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { requirePermission } from "@auth";
import { spawnSync } from "child_process";

const SHOP_ID_REGEX = /^[a-z0-9_-]+$/;

export const runtime = "nodejs";

export async function POST() {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" /* i18n-exempt: API error, not user-facing UI */ }, { status: 401 });
  }

  try {
    const raw = await fs.readFile(join(process.cwd(), "shop.json"), "utf8");
    const { id } = JSON.parse(raw) as { id: string };
    if (!SHOP_ID_REGEX.test(id)) {
      return NextResponse.json({ error: "Invalid shop ID" /* i18n-exempt: API error, not user-facing UI */ }, { status: 400 });
    }
    const root = join(process.cwd(), "..", "..");
    const res = spawnSync(
      "pnpm",
      ["ts-node", "scripts/src/republish-shop.ts", id],
      { cwd: root, stdio: "inherit" },
    );
    if (res.status !== 0) {
      throw new Error("republish failed" /* i18n-exempt: developer error */);
    }
    return NextResponse.json({ status: "ok" /* i18n-exempt: API status */ });
  } catch (err) {
    console.error("Publish failed" /* i18n-exempt: developer log */, err);
    return NextResponse.json({ error: "Publish failed" /* i18n-exempt: API error, not user-facing UI */ }, { status: 500 });
  }
}
