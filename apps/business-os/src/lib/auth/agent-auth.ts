import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AGENT_API_HEADER = "x-agent-api-key";
const MIN_KEY_LENGTH = 32;
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;

const ERROR_UNAUTHORIZED = "Unauthorized"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const ERROR_RATE_LIMITED = "RATE_LIMITED"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const ERROR_SERVER_CONFIG = "SERVER_MISCONFIGURED"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const MESSAGE_MISSING_KEY =
  "Missing X-Agent-API-Key header"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const MESSAGE_INVALID_KEY =
  "Invalid API key"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const MESSAGE_RATE_LIMIT =
  "Too many requests for this API key"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const MESSAGE_MISSING_ENV =
  "BOS_AGENT_API_KEY is not configured"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const MESSAGE_INVALID_ENV =
  "BOS_AGENT_API_KEY does not meet format requirements"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const LOG_MISSING_KEY = "Agent auth failed: missing API key"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const LOG_INVALID_KEY = "Agent auth failed: invalid API key"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const LOG_RATE_LIMIT = "Agent auth rate limit exceeded"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const LOG_MISSING_ENV = "Agent auth misconfigured: missing BOS_AGENT_API_KEY"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]
const LOG_INVALID_ENV = "Agent auth misconfigured: invalid BOS_AGENT_API_KEY format"; // i18n-exempt -- BOS-01 [ttl=2026-03-31]

type RateLimitBucket = {
  windowStart: number;
  count: number;
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();

export type AgentAuthContext = {
  actor: "agent";
};

export async function requireAgentAuth(
  request: NextRequest
): Promise<AgentAuthContext | NextResponse> {
  const providedKey = request.headers.get(AGENT_API_HEADER);
  if (!providedKey) {
    console.warn(LOG_MISSING_KEY);
    return NextResponse.json(
      { error: ERROR_UNAUTHORIZED, message: MESSAGE_MISSING_KEY },
      { status: 401 }
    );
  }

  if (isRateLimited(providedKey, Date.now())) {
    console.warn(LOG_RATE_LIMIT);
    return NextResponse.json(
      { error: ERROR_RATE_LIMITED, message: MESSAGE_RATE_LIMIT },
      { status: 429 }
    );
  }

  const expectedKey = process.env.BOS_AGENT_API_KEY;
  if (!expectedKey) {
    console.error(LOG_MISSING_ENV);
    return NextResponse.json(
      { error: ERROR_SERVER_CONFIG, message: MESSAGE_MISSING_ENV },
      { status: 500 }
    );
  }

  if (!isKeyFormatValid(expectedKey)) {
    console.error(LOG_INVALID_ENV);
    return NextResponse.json(
      { error: ERROR_SERVER_CONFIG, message: MESSAGE_INVALID_ENV },
      { status: 500 }
    );
  }

  const formatValid = isKeyFormatValid(providedKey);
  const matches = await timingSafeCompare(providedKey, expectedKey);

  if (!formatValid || !matches) {
    console.warn(LOG_INVALID_KEY);
    return NextResponse.json(
      { error: ERROR_UNAUTHORIZED, message: MESSAGE_INVALID_KEY },
      { status: 401 }
    );
  }

  return { actor: "agent" };
}

export function __resetAgentRateLimitForTests(): void {
  rateLimitBuckets.clear();
}

function isKeyFormatValid(key: string): boolean {
  if (key.length < MIN_KEY_LENGTH) {
    return false;
  }
  const hasAlphaNumeric = /[A-Za-z0-9]/.test(key);
  const hasSpecial = /[^A-Za-z0-9]/.test(key);
  return hasAlphaNumeric && hasSpecial;
}

function isRateLimited(key: string, now: number): boolean {
  const bucket = rateLimitBuckets.get(key);
  if (!bucket) {
    rateLimitBuckets.set(key, { windowStart: now, count: 1 });
    return false;
  }

  if (now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(key, { windowStart: now, count: 1 });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

async function timingSafeCompare(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const expectedBytes = encoder.encode(b);
  const providedBytes = encoder.encode(a);
  const aligned = new Uint8Array(expectedBytes.length);
  aligned.set(providedBytes.subarray(0, expectedBytes.length));

  const matches = await timingSafeEqualBytes(aligned, expectedBytes);
  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }
  return matches;
}

async function timingSafeEqualBytes(
  a: Uint8Array,
  b: Uint8Array
): Promise<boolean> {
  const subtle = globalThis.crypto?.subtle as
    | (SubtleCrypto & {
        timingSafeEqual?: (
          first: ArrayBufferView,
          second: ArrayBufferView
        ) => boolean | Promise<boolean>;
      })
    | undefined;

  if (subtle?.timingSafeEqual) {
    const result = subtle.timingSafeEqual(a, b);
    return typeof result === "boolean" ? result : await result;
  }

  return constantTimeEqual(a, b);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const maxLength = Math.max(a.length, b.length);
  let diff = 0;

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }

  return diff === 0 && a.length === b.length;
}
