import { NextResponse } from "next/server";
import { requirePermission } from "@auth";
import { coreEnv } from "@acme/config/env/core";
import { createUpgradePreviewToken } from "@platform-core/previewTokens";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requirePermission("manage_orders");
  } catch {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31] API error message
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageId = new URL(req.url).searchParams.get("pageId");
  if (!pageId) {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31] API error message
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
  const secret = coreEnv.UPGRADE_PREVIEW_TOKEN_SECRET as string | undefined;
  if (!secret) {
    // i18n-exempt -- ABC-123 [ttl=2025-12-31] API error message
    return NextResponse.json(
      { error: "Token secret not configured" }, // i18n-exempt -- ABC-123 [ttl=2025-12-31] config error message
      { status: 500 },
    );
  }
  const shopId = coreEnv.NEXT_PUBLIC_SHOP_ID || "default";
  const token = createUpgradePreviewToken(
    { shopId, pageId },
    secret as string,
  );
  return NextResponse.json({ token });
}
