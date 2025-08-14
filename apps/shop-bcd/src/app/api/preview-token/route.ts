import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { requirePermission } from "@auth";
import { env } from "@acme/config";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requirePermission("manage_orders");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageId = new URL(req.url).searchParams.get("pageId");
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
  const secret = env.UPGRADE_PREVIEW_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Token secret not configured" },
      { status: 500 },
    );
  }
  const token = createHmac("sha256", secret).update(pageId).digest("hex");
  return NextResponse.json({ token });
}

