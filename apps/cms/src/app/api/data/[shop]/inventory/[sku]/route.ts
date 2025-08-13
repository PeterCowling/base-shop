import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { inventoryItemSchema } from "@acme/types";
import { updateInventoryItem } from "@platform-core/repositories/inventory.server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; sku: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = inventoryItemSchema.partial().safeParse(body);
    if (!parsed.success || !parsed.data.variantAttributes) {
      const message = parsed.success
        ? "variantAttributes required"
        : parsed.error.flatten().formErrors.join(", ");
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { shop, sku } = await context.params;
    const { variantAttributes, ...patch } = parsed.data;
    const item = await updateInventoryItem(shop, sku, variantAttributes, patch);
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}
