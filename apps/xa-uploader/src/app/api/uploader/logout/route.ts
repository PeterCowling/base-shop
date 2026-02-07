import { NextResponse } from "next/server";

import { clearUploaderCookie } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearUploaderCookie(response);
  return response;
}
