import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { createRequire } from "module";
import { join } from "path";

import { requirePermission } from "@acme/auth";
// The republish utility lives in the top-level scripts directory and isn't
// published as a package. Load it via `createRequire` so the build can
// resolve the CommonJS module without relying on a workspace alias.
const require = createRequire(import.meta.url);
const { republishShop } = require("../../../../../../scripts/src/republish-shop") as {
  republishShop: (shopId: string, repoRoot: string) => void;
};

export const runtime = "nodejs";

export async function POST() {
  try {
    await requirePermission("manage_orders");
  } catch {
    // i18n-exempt -- DS-1234 API error identifier; not user-facing copy
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await fs.readFile(join(process.cwd(), "shop.json"), "utf8");
    const { id } = JSON.parse(raw) as { id: string };
    const root = join(process.cwd(), "..", "..");
    republishShop(id, root);
    await fs.rm(join(root, "data", "shops", id, "upgrade.json"), { force: true });
    // i18n-exempt -- DS-1234 API status token; not user-facing copy
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    // i18n-exempt -- DS-1234 log label; not user-facing copy
    console.error("Publish failed", err);
    // i18n-exempt -- DS-1234 API error identifier; not user-facing copy
    return NextResponse.json({ error: "Publish failed" }, { status: 500 });
  }
}
