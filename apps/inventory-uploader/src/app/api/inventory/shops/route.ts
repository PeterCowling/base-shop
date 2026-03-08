import { NextResponse } from "next/server";

import { listShops } from "@acme/platform-core/repositories/shops.server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const shops = await listShops(1, 200);
    return NextResponse.json({ ok: true, shops });
  } catch {
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
