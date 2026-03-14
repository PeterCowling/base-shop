import { NextResponse } from "next/server";

import {
  CatalogDraftContractError,
  readCloudCurrencyRates,
  writeCloudCurrencyRates,
} from "../../../../lib/catalogDraftContractClient";
import { DEFAULT_STOREFRONT } from "../../../../lib/catalogStorefront";
import { validateCurrencyRatesInput } from "../../../../lib/currencyRates";
import { getRequestIp, rateLimit, withRateHeaders } from "../../../../lib/rateLimit";
import { PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { isRecord } from "../../../../lib/typeGuards";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";
import { uploaderLog } from "../../../../lib/uploaderLogger";

export const runtime = "nodejs";

type CurrencyRatesBody = {
  rates?: unknown;
};

const GET_WINDOW_MS = 60 * 1000;
const GET_MAX_REQUESTS = 60;
const PUT_WINDOW_MS = 60 * 1000;
const PUT_MAX_REQUESTS = 20;
const PUT_MAX_BYTES = 4 * 1024;

function buildErrorResponse(
  error:
    | "invalid_rates"
    | "rate_limited"
    | "invalid"
    | "payload_too_large"
    | "internal_error"
    | "service_unavailable",
  status: number,
  reason: string,
): NextResponse {
  return NextResponse.json({ ok: false, error, reason }, { status });
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
    const rates = await readCloudCurrencyRates(DEFAULT_STOREFRONT);
    return withRateHeaders(NextResponse.json({ ok: true, rates }), limit);
  } catch (error) {
    if (error instanceof CatalogDraftContractError) {
      const isInvalidRates = error.code === "invalid_response";
      uploaderLog("error", "currency_rates_read_failed", { storefront: DEFAULT_STOREFRONT, code: error.code });
      return withRateHeaders(
        buildErrorResponse(
          isInvalidRates ? "invalid_rates" : "service_unavailable",
          isInvalidRates ? 409 : 503,
          isInvalidRates ? "currency_rates_invalid" : "currency_rates_contract_unavailable",
        ),
        limit,
      );
    }
    uploaderLog("error", "currency_rates_read_failed", { storefront: DEFAULT_STOREFRONT, error: String(error) });
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
    return withRateHeaders(buildErrorResponse("invalid", 400, "invalid_json"), limit);
  }

  if (!isRecord(payload) || !("rates" in payload)) {
    return withRateHeaders(
      buildErrorResponse("invalid_rates", 400, "missing_rates_object"),
      limit,
    );
  }

  const validated = validateCurrencyRatesInput(payload.rates);
  if (validated.ok === false) {
    return withRateHeaders(
      buildErrorResponse("invalid_rates", 400, validated.reason),
      limit,
    );
  }

  try {
    await writeCloudCurrencyRates({
      storefront: DEFAULT_STOREFRONT,
      rates: validated.rates,
    });
    return withRateHeaders(NextResponse.json({ ok: true }), limit);
  } catch (error) {
    if (error instanceof CatalogDraftContractError) {
      uploaderLog("error", "currency_rates_write_failed", { storefront: DEFAULT_STOREFRONT, code: error.code });
      return withRateHeaders(
        buildErrorResponse("service_unavailable", 503, "currency_rates_contract_unavailable"),
        limit,
      );
    }
    uploaderLog("error", "currency_rates_write_failed", { storefront: DEFAULT_STOREFRONT, error: String(error) });
    return withRateHeaders(buildErrorResponse("internal_error", 500, "internal_error"), limit);
  }
}
