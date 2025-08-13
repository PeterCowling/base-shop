import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { inventoryItemSchema } from "@acme/types";
import { updateInventoryItem } from "@platform-core/repositories/inventory.server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; sku: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = inventoryItemSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join(", ") },
        { status: 400 },
      );
    }
    const { shop, sku } = await context.params;
    const patch = parsed.data;
    const variantAttributes = patch.variantAttributes ?? {};
    const updated = await updateInventoryItem(
      shop,
      sku,
      variantAttributes,
      (current) => {
        if (!current) throw new Error("Not found");
        return { ...current, ...patch, sku, variantAttributes };
      },
    );
    return NextResponse.json(updated);
  } catch (err) {
    const status = (err as Error).message === "Not found" ? 404 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
