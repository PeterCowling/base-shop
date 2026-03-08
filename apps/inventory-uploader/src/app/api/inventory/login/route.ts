import { NextResponse } from "next/server";

import {
  issueInventorySession,
  setInventoryCookie,
  validateInventoryAdminToken,
} from "../../../../lib/auth/session";

export const runtime = "nodejs";

const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_PAYLOAD_MAX_BYTES = 8 * 1024;

// In-memory rate limiter — sufficient for internal operator console.
// Module-level store persists for the lifetime of the Worker instance.
type RateLimitEntry = { count: number; resetAt: number };

const rateLimitStore = new Map<string, RateLimitEntry>();

function getRateLimitStore() {
  return rateLimitStore;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const store = getRateLimitStore();
  // Prune expired entries
  for (const [k, v] of store.entries()) {
    if (v.resetAt <= now) store.delete(k);
  }
  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  if (entry.count > LOGIN_MAX_ATTEMPTS) return false;
  return true;
}

function getRequestIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  if (!checkRateLimit(`inventory-login:${ip}`)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // Check content-length before reading body
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsed = Number(contentLength);
    if (Number.isFinite(parsed) && parsed > LOGIN_PAYLOAD_MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
    }
  }

  let payload: unknown;
  try {
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > LOGIN_PAYLOAD_MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
    }
    if (!text.trim()) {
      return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
    }
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const token = isRecord(payload) && typeof payload.token === "string" ? payload.token : "";
  if (!token.trim()) {
    return NextResponse.json({ ok: false, error: "missing" }, { status: 400 });
  }

  const valid = await validateInventoryAdminToken(token);
  if (!valid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const sessionToken = await issueInventorySession();
  const response = NextResponse.json({ ok: true });
  setInventoryCookie(response, sessionToken);
  return response;
}
