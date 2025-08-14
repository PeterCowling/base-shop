import { NextResponse, type NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { env } from "@acme/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const pageId = req.nextUrl.searchParams.get("pageId");
  if (!pageId) {
    return NextResponse.json({ error: "Missing pageId" }, { status: 400 });
  }
  const secret = env.UPGRADE_PREVIEW_TOKEN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Token secret not configured" }, { status: 500 });
  }
  const token = createHmac("sha256", secret).update(pageId).digest("hex");
  return NextResponse.json({ token });
}
