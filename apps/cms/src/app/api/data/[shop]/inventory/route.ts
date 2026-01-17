import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { inventoryItemSchema } from "@acme/platform-core/types/inventory";
import { inventoryRepository } from "@acme/platform-core/repositories/inventory.server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ shop: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "ShopAdmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await req.json();
    const parsed = inventoryItemSchema.array().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().formErrors.join(", ") },
        { status: 400 }
      );
    }
    const { shop } = await context.params;
    await inventoryRepository.write(shop, parsed.data);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Inventory write failed", err); // i18n-exempt -- non-UX log
    const message = (err as Error).message;
    const status = /delegate is unavailable/i.test(message) ? 503 : 400;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
