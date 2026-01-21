import { NextResponse } from "next/server";

import { requirePermission } from "@acme/auth";
import { listSectionHistory } from "@acme/platform-core/repositories/sections/sections.json.server";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { shop: string } }) {
  try {
    await requirePermission("manage_pages");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { shop } = params;
    const history = await listSectionHistory(shop);
    return NextResponse.json(history, { status: 200 });
  } catch (err) {
    console.error("sections history failed", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}

