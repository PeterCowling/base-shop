import { NextResponse } from "next/server";

import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import {
  issueUploaderSession,
  setUploaderCookie,
  validateUploaderAdminToken,
} from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_PAYLOAD_MAX_BYTES = 8 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-login:${requestIp}`,
    windowMs: LOGIN_WINDOW_MS,
    max: LOGIN_MAX_ATTEMPTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 }),
      limit,
    );
  }

  let payload: unknown;
  try {
    payload = await readJsonBodyWithLimit(request, LOGIN_PAYLOAD_MAX_BYTES);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 }),
        limit,
      );
    }
    if (error instanceof InvalidJsonError) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }),
        limit,
      );
    }
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }),
      limit,
    );
  }

  const token = isRecord(payload) && typeof payload.token === "string" ? payload.token : "";
  if (!token.trim()) {
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "missing" }, { status: 400 }),
      limit,
    );
  }

  const valid = await validateUploaderAdminToken(token);
  if (!valid) {
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
      limit,
    );
  }

  const sessionToken = await issueUploaderSession();
  const response = NextResponse.json({ ok: true });
  setUploaderCookie(response, sessionToken);
  return withRateHeaders(response, limit);
}
