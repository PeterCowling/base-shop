import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { requirePermission } from "@auth";
import { coreEnv } from "@acme/config/env/core";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requirePermission("manage_orders");
  } catch {
    // i18n-exempt: API error message
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageId = new URL(req.url).searchParams.get("pageId");
  if (!pageId) {
    // i18n-exempt: API error message
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
    const secret = coreEnv.UPGRADE_PREVIEW_TOKEN_SECRET as string | undefined;
  if (!secret) {
    // i18n-exempt: API error message
    return NextResponse.json(
      { error: "Token secret not configured" }, // i18n-exempt: config error message
      { status: 500 },
    );
  }
  const token = createHmac("sha256", secret).update(pageId).digest("hex");
  return NextResponse.json({ token });
}
