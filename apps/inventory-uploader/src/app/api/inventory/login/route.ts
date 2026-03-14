import { NextResponse } from "next/server";

import { inventoryLog } from "../../../../lib/auth/inventoryLog";
import { getRequestIp, rateLimit, withRateHeaders } from "../../../../lib/auth/rateLimit";
import {
  issueInventorySession,
  setInventoryCookie,
  validateInventoryAdminToken,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_PAYLOAD_MAX_BYTES = 8 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  const requestIp = getRequestIp(request);
  const limit = rateLimit({
    key: `inventory-login:${requestIp}`,
    windowMs: LOGIN_WINDOW_MS,
    max: LOGIN_MAX_ATTEMPTS,
  });

  if (!limit.allowed) {
    inventoryLog("warn", "rate_limited", { ip: requestIp });
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 }),
      limit,
    );
  }

  // Check content-length before reading body
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > LOGIN_PAYLOAD_MAX_BYTES) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 }),
        limit,
      );
    }
  }

  let payload: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > LOGIN_PAYLOAD_MAX_BYTES) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 }),
        limit,
      );
    }
    if (!text.trim()) {
      return withRateHeaders(
        NextResponse.json({ ok: false, error: "invalid" }, { status: 400 }),
        limit,
      );
    }
    payload = JSON.parse(text);
  } catch {
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

  const valid = await validateInventoryAdminToken(token);
  if (!valid) {
    inventoryLog("warn", "login_failed", { ip: requestIp });
    return withRateHeaders(
      NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 }),
      limit,
    );
  }

  const sessionToken = await issueInventorySession();
  const response = NextResponse.json({ ok: true });
  setInventoryCookie(response, sessionToken);
  return withRateHeaders(response, limit);
}
