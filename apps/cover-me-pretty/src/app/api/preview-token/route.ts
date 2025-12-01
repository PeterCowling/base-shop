import { NextResponse } from "next/server";
import { requirePermission } from "@auth";
import { coreEnv as env } from "@acme/config/env/core";
import { createUpgradePreviewToken } from "@platform-core/previewTokens";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requirePermission("manage_orders");
  } catch {
    // i18n-exempt -- DS-1234 API error identifier; not user-facing copy
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageId = new URL(req.url).searchParams.get("pageId");
  if (!pageId) {
    // i18n-exempt -- DS-1234 API error identifier; not user-facing copy
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
  const secret = env.UPGRADE_PREVIEW_TOKEN_SECRET;
  if (!secret) {
    // i18n-exempt -- DS-1234 API error identifier; not user-facing copy
    return NextResponse.json(
      { error: "Token secret not configured" /* i18n-exempt -- DS-1234 API error identifier; not user-facing copy */ },
      { status: 500 },
    );
  }
  const shopId = env.NEXT_PUBLIC_SHOP_ID || "default";
  const token = createUpgradePreviewToken(
    { shopId, pageId },
    secret as string,
  );
  return NextResponse.json({ token });
}
