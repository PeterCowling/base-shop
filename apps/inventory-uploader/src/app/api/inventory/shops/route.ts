import { NextResponse } from "next/server";

import { listShops } from "@acme/platform-core/repositories/shops.server";

import { apiError } from "../../../../lib/api-helpers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const shops = await listShops(1, 200);
    return NextResponse.json({ ok: true, shops });
  } catch (err) {
    return apiError(err);
  }
}
