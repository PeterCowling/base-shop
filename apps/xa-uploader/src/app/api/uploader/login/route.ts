import { NextResponse } from "next/server";

import {
  issueUploaderSession,
  setUploaderCookie,
  validateUploaderAdminToken,
} from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const token = isRecord(payload) && typeof payload.token === "string" ? payload.token : "";
  if (!token.trim()) {
    return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  }

  const valid = await validateUploaderAdminToken(token);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sessionToken = await issueUploaderSession();
  const response = NextResponse.json({ ok: true });
  setUploaderCookie(response, sessionToken);
  return response;
}
