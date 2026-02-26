import { NextResponse } from "next/server";

import { compareAdminKey, setAdminCookie, signAdminSession } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const adminKey = process.env.CARYINA_ADMIN_KEY;
  if (!adminKey) {
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const submitted = typeof body.key === "string" ? body.key : "";
  if (!submitted) {
    return NextResponse.json({ ok: false, error: "missing_key" }, { status: 400 });
  }

  if (!compareAdminKey(submitted, adminKey)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const token = await signAdminSession(adminKey);
  const response = NextResponse.json({ ok: true });
  setAdminCookie(response, token);
  return response;
}
