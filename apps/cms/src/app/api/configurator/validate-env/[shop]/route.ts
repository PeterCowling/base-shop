import { type NextRequest,NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";

import { validateShopEnv } from "@acme/platform-core/configurator";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
    const { shop } = await context.params;
    validateShopEnv(shop);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      message === "Forbidden" || message === "Unauthorized" ? 403 : 400;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
