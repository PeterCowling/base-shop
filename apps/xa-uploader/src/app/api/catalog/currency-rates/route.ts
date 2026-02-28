/* eslint-disable ds/no-hardcoded-copy -- XAUP-0001 [ttl=2026-12-31] machine-token route guards and reason codes */
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { applyRateLimitHeaders, getRequestIp, rateLimit } from "../../../../lib/rateLimit";
import { resolveRepoRoot } from "../../../../lib/repoRoot";
import { InvalidJsonError, PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type CurrencyRates = { EUR: number; GBP: number; AUD: number };

type CurrencyRatesBody = {
  rates?: unknown;
};

const GET_WINDOW_MS = 60 * 1000;
const GET_MAX_REQUESTS = 60;
const PUT_WINDOW_MS = 60 * 1000;
const PUT_MAX_REQUESTS = 20;
const PUT_MAX_BYTES = 4 * 1024;
const MAX_RATE_VALUE = 1000.0;

const uploaderDataDir = path.join(resolveRepoRoot(), "apps", "xa-uploader", "data");
const ratesFilePath = path.join(uploaderDataDir, "currency-rates.json");

function withRateHeaders(response: NextResponse, limit: ReturnType<typeof rateLimit>): NextResponse {
  applyRateLimitHeaders(response.headers, limit);
  return response;
}

function buildErrorResponse(
  error: "invalid_rates" | "rate_limited" | "invalid" | "payload_too_large" | "internal_error",
  status: number,
  reason: string,
): NextResponse {
  return NextResponse.json({ ok: false, error, reason }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateRatesInput(value: unknown): { ok: true; rates: CurrencyRates } | { ok: false; reason: string } {
  if (!isRecord(value)) {
    return { ok: false, reason: "rates_must_be_object" };
  }

  const candidate = {
    EUR: value.EUR,
    GBP: value.GBP,
    AUD: value.AUD,
  };

  for (const [code, rawValue] of Object.entries(candidate)) {
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
      return { ok: false, reason: `${code}_must_be_finite_number` };
    }
    if (rawValue <= 0) {
      return { ok: false, reason: `${code}_must_be_gt_zero` };
    }
    if (rawValue > MAX_RATE_VALUE) {
      return { ok: false, reason: `${code}_must_be_lte_${MAX_RATE_VALUE}` };
    }
  }

  return {
    ok: true,
    rates: {
      EUR: candidate.EUR as number,
      GBP: candidate.GBP as number,
      AUD: candidate.AUD as number,
    },
  };
}

export async function GET(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-currency-rates-get:${requestIp}`,
    windowMs: GET_WINDOW_MS,
    max: GET_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      buildErrorResponse("rate_limited", 429, "currency_rates_get_rate_limited"),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  try {
    const raw = await fs.readFile(ratesFilePath, "utf8");
    try {
      const parsed = JSON.parse(raw) as unknown;
      const validated = validateRatesInput(parsed);
      if (validated.ok === false) {
        console.warn(`[xa-uploader] currency-rates.json invalid shape: ${validated.reason}`);
        return withRateHeaders(NextResponse.json({ ok: true, rates: null }), limit);
      }
      return withRateHeaders(NextResponse.json({ ok: true, rates: validated.rates }), limit);
    } catch (error) {
      console.warn("[xa-uploader] failed to parse currency-rates.json", error);
      return withRateHeaders(NextResponse.json({ ok: true, rates: null }), limit);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
      return withRateHeaders(NextResponse.json({ ok: true, rates: null }), limit);
    }
    return withRateHeaders(buildErrorResponse("internal_error", 500, "currency_rates_read_failed"), limit);
  }
}

export async function PUT(request: Request) {
  const requestIp = getRequestIp(request) || "unknown";
  const limit = rateLimit({
    key: `xa-uploader-currency-rates-put:${requestIp}`,
    windowMs: PUT_WINDOW_MS,
    max: PUT_MAX_REQUESTS,
  });
  if (!limit.allowed) {
    return withRateHeaders(
      buildErrorResponse("rate_limited", 429, "currency_rates_put_rate_limited"),
      limit,
    );
  }

  const authenticated = await hasUploaderSession(request);
  if (!authenticated) {
    return withRateHeaders(NextResponse.json({ ok: false }, { status: 404 }), limit);
  }

  let payload: CurrencyRatesBody;
  try {
    payload = (await readJsonBodyWithLimit(request, PUT_MAX_BYTES)) as CurrencyRatesBody;
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return withRateHeaders(
        buildErrorResponse("payload_too_large", 413, "payload_too_large"),
        limit,
      );
    }
    if (error instanceof InvalidJsonError) {
      return withRateHeaders(buildErrorResponse("invalid", 400, "invalid_json"), limit);
    }
    return withRateHeaders(buildErrorResponse("invalid", 400, "invalid_json"), limit);
  }

  if (!isRecord(payload) || !("rates" in payload)) {
    return withRateHeaders(
      buildErrorResponse("invalid_rates", 400, "missing_rates_object"),
      limit,
    );
  }

  const validated = validateRatesInput(payload.rates);
  if (validated.ok === false) {
    return withRateHeaders(
      buildErrorResponse("invalid_rates", 400, validated.reason),
      limit,
    );
  }

  const tmpPath = `${ratesFilePath}.tmp`;
  try {
    await fs.mkdir(uploaderDataDir, { recursive: true });
    await fs.writeFile(tmpPath, `${JSON.stringify(validated.rates, null, 2)}\n`, "utf8");
    await fs.rename(tmpPath, ratesFilePath);
    return withRateHeaders(NextResponse.json({ ok: true }), limit);
  } catch {
    return withRateHeaders(buildErrorResponse("internal_error", 500, "internal_error"), limit);
  }
}
