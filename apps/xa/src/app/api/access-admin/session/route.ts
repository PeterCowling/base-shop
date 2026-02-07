import { NextResponse } from "next/server";

import { hasAdminSession } from "../../../../lib/accessAdmin";
import { loadAccessStore } from "../../../../lib/accessStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authenticated = await hasAdminSession(request);
  const response = { ok: true, authenticated };
  if (!authenticated) {
    return NextResponse.json(response);
  }
  const { mode } = await loadAccessStore();
  return NextResponse.json({ ...response, storeMode: mode });
}
