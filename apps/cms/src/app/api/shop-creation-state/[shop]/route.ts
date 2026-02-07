// apps/cms/src/app/api/shop-creation-state/[shop]/route.ts
import "@acme/zod-utils/initZod";

import { type NextRequest,NextResponse } from "next/server";
import { ensureRole } from "@cms/actions/common/auth";

import { readShopCreationState } from "@acme/platform-core/createShop";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  try {
    await ensureRole(["admin", "ShopAdmin"]);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { shop } = await context.params;
  const state = readShopCreationState(shop);
  if (!state) {
    return NextResponse.json(
      {
        shopId: shop,
        status: "unknown",
      },
      { status: 200 },
    );
  }
  return NextResponse.json(state, { status: 200 });
}

