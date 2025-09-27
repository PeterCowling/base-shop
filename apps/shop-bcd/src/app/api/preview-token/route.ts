import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { requirePermission } from "@auth";
import { authEnv as env } from "@acme/config/env/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    await requirePermission("manage_orders");
  } catch {
    // eslint-disable-next-line ds/no-hardcoded-copy -- API error identifier; not user-facing copy
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageId = new URL(req.url).searchParams.get("pageId");
  if (!pageId) {
    // eslint-disable-next-line ds/no-hardcoded-copy -- API error identifier; not user-facing copy
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
  const secret = env.UPGRADE_PREVIEW_TOKEN_SECRET;
  if (!secret) {
    // eslint-disable-next-line ds/no-hardcoded-copy -- API error identifier; not user-facing copy
    return NextResponse.json(
      { error: "Token secret not configured" },
      { status: 500 },
    );
  }
  const token = createHmac("sha256", secret as string)
    .update(pageId)
    .digest("hex");
  return NextResponse.json({ token });
}
