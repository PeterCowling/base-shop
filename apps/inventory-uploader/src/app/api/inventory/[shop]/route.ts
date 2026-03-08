import { type NextRequest, NextResponse } from "next/server";

import { inventoryRepository } from "@acme/platform-core/repositories/inventory.server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ shop: string }> },
) {
  const { shop } = await context.params;
  try {
    const items = await inventoryRepository.read(shop);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
