import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const data = await req.json().catch(() => ({}));
  const versions =
    typeof data === "object" && data && "versions" in data
      ? (data as { versions: unknown }).versions
      : undefined;
  const res = NextResponse.json({ ok: true });
  if (versions) {
    res.cookies.set("component-versions", JSON.stringify(versions), {
      path: "/",
    });
  }
  return res;
}
