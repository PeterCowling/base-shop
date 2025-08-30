// apps/cms/src/app/api/shops/route.ts
import { NextResponse } from "next/server";
import { listShops } from "../../../lib/listShops";

export const runtime = "nodejs";

export async function GET() {
  try {
    const shops = await listShops();
    return NextResponse.json(shops);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[api/shops:GET] error", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
