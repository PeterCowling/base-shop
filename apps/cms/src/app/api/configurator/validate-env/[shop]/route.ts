import { ensureRole } from "@cms/actions/common/auth";
import { NextResponse, type NextRequest } from "next/server";
import { validateShopEnv } from "@platform-core/configurator";

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
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
