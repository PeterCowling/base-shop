import { NextResponse } from "next/server";

import { clearAccountCookie } from "../../../../lib/accountAuth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAccountCookie(response);
  return response;
}
