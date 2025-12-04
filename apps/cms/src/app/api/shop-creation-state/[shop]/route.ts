// apps/cms/src/app/api/shop-creation-state/[shop]/route.ts
import "@acme/zod-utils/initZod";
import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { readShopCreationState } from "@platform-core/createShop";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
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

