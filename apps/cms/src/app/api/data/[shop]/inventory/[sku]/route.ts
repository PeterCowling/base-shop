import { type NextRequest,NextResponse } from "next/server";
import { ensureShopAccess } from "@cms/actions/common/auth";

import { inventoryRepository } from "@acme/platform-core/repositories/inventory.server";
import { inventoryItemSchema } from "@acme/platform-core/types/inventory";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ shop: string; sku: string }> },
) {
  const { shop, sku } = await context.params;
  try {
    await ensureShopAccess(shop);
  } catch (err) {
    const message = (err as Error).message;
    const status = message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: message === "Forbidden" ? "Forbidden" : "Unauthorized" }, { status });
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
    const patch = parsed.data;
    const variantAttributes = patch.variantAttributes ?? {};
    const updated = await inventoryRepository.update(
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
    console.error("Inventory patch failed", err); // i18n-exempt -- non-UX log
    const message = (err as Error).message;
    const status =
      message === "Not found"
        ? 404
        : /delegate is unavailable/i.test(message)
          ? 503
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
