import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { requirePermission } from "@auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageId = new URL(request.url).searchParams.get("pageId");
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }

  const secret = process.env.UPGRADE_PREVIEW_TOKEN_SECRET || "";
  const token = createHmac("sha256", secret).update(pageId).digest("hex");

  return NextResponse.json({ token });
}
