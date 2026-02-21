import { NextResponse } from "next/server";

import { clearAdminCookie } from "../../../../lib/accessAdmin";

// Uses node:crypto via accessAdmin.
export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAdminCookie(response);
  return response;
}
