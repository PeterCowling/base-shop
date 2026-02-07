// apps/cms/src/app/api/shops/route.ts

import { NextResponse } from "next/server";
import { ensureAuthorized } from "@cms/actions/common/auth";

import { logger } from "@acme/lib/logger";
import { sanitizeError } from "@acme/platform-core/utils";

import { listShops } from "../../../lib/listShops";

export const runtime = "nodejs";

/**
 * Handle GET requests for the list of shops. Requires authentication.
 * Any errors are logged to the console and surfaced to the client via a
 * generic sanitized message.
 */
export async function GET() {
  // Require authentication to list shops
  try {
    await ensureAuthorized();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const shops = await listShops();
    return NextResponse.json(shops);
  } catch (err) {
    logger.error("[api/shops:GET] error", { error: err });
    const safe = sanitizeError(err, "INTERNAL_ERROR", "api/shops");
    return NextResponse.json({ error: safe.message }, { status: 500 });
  }
}
