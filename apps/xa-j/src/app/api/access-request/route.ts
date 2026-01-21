import { NextResponse } from "next/server";

import { createAccessRequest } from "../../../lib/accessStore";
import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../lib/rateLimit";

export const runtime = "edge";

function sanitize(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `access-request:${requestIp || "unknown"}`,
    windowMs: 60 * 60 * 1000,
    max: 5,
  });
  if (!limit.allowed) {
    const headers = new Headers();
    applyRateLimitHeaders(headers, limit);
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const handle = sanitize(payload.handle, 80);
  const referredBy = sanitize(payload.referredBy, 120);
  const note = sanitize(payload.note, 280);
  const userAgent = request.headers.get("user-agent") ?? "";

  const { request: entry, storeMode } = await createAccessRequest({
    handle,
    referredBy,
    note,
    userAgent,
    requestIp,
  });

  const response = NextResponse.json({ ok: true, id: entry.id, storeMode });
  applyRateLimitHeaders(response.headers, limit);
  return response;
}
