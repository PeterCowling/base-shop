import { NextResponse } from "next/server";

import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authenticated = await hasUploaderSession(request);
  return NextResponse.json({ ok: true, authenticated });
}
