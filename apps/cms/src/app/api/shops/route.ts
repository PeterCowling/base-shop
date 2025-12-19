// apps/cms/src/app/api/shops/route.ts

import { NextResponse } from "next/server";
import { listShops } from "../../../lib/listShops";
import { logger } from "@acme/shared-utils";

export const runtime = "nodejs";

/**
 * Handle GET requests for the list of shops.  Any errors are logged to the
 * console and surfaced to the client via a 500 response with a minimal
 * message.  This file intentionally omits eslint suppression comments and
 * instead relies on proper logging methods.
 */
export async function GET() {
  try {
    const shops = await listShops();
    return NextResponse.json(shops);
  } catch (err) {
    logger.error("[api/shops:GET] error", { error: err });
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
