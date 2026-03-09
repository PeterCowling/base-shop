import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  CatalogDraftContractError,
  readCloudCurrencyRates,
  writeCloudCurrencyRates,
} from "../../../../lib/catalogDraftContractClient";
import { DEFAULT_STOREFRONT } from "../../../../lib/catalogStorefront";
import {
  serializeCurrencyRates,
  validateCurrencyRatesInput,
} from "../../../../lib/currencyRates";
import { isLocalFsRuntimeEnabled } from "../../../../lib/localFsGuard";
import { getRequestIp, rateLimit, withRateHeaders } from "../../../../lib/rateLimit";
import { resolveRepoRoot } from "../../../../lib/repoRoot";
import { PayloadTooLargeError, readJsonBodyWithLimit } from "../../../../lib/requestJson";
import { isRecord } from "../../../../lib/typeGuards";
import { hasUploaderSession } from "../../../../lib/uploaderAuth";

export const runtime = "nodejs";

type CurrencyRatesBody = {
  rates?: unknown;
};

const GET_WINDOW_MS = 60 * 1000;
const GET_MAX_REQUESTS = 60;
const PUT_WINDOW_MS = 60 * 1000;
const PUT_MAX_REQUESTS = 20;
const PUT_MAX_BYTES = 4 * 1024;

const uploaderDataDir = path.join(resolveRepoRoot(), "apps", "xa-uploader", "data");
const ratesFilePath = path.join(uploaderDataDir, "currency-rates.json");


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
    if (!isLocalFsRuntimeEnabled()) {
      const rates = await readCloudCurrencyRates(DEFAULT_STOREFRONT);
      return withRateHeaders(NextResponse.json({ ok: true, rates }), limit);
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- XAUP-118 controlled path rooted to repo-local uploader data dir
    const raw = await fs.readFile(ratesFilePath, "utf8");
    try {
      const parsed = JSON.parse(raw) as unknown;
      const validated = validateCurrencyRatesInput(parsed);
      if (validated.ok === false) {
        console.warn(`[xa-uploader] currency-rates.json invalid shape: ${validated.reason}`);
        return withRateHeaders(
          buildErrorResponse("invalid_rates", 409, "currency_rates_invalid"),
          limit,
        );
      }
      return withRateHeaders(NextResponse.json({ ok: true, rates: validated.rates }), limit);
    } catch (error) {
      console.warn("[xa-uploader] failed to parse currency-rates.json", error);
      return withRateHeaders(
        buildErrorResponse("invalid_rates", 409, "currency_rates_invalid"),
        limit,
      );
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
      return withRateHeaders(NextResponse.json({ ok: true, rates: null }), limit);
    }
    if (error instanceof CatalogDraftContractError) {
      const isInvalidRates = error.code === "invalid_response";
      return withRateHeaders(
        buildErrorResponse(
          isInvalidRates ? "invalid_rates" : "service_unavailable",
          isInvalidRates ? 409 : 503,
          isInvalidRates ? "currency_rates_invalid" : "currency_rates_contract_unavailable",
        ),
        limit,
      );
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
    if (!isLocalFsRuntimeEnabled()) {
      await writeCloudCurrencyRates({
        storefront: DEFAULT_STOREFRONT,
        rates: validated.rates,
      });
      return withRateHeaders(NextResponse.json({ ok: true }), limit);
    }

    const tmpPath = `${ratesFilePath}.tmp`;
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- XAUP-118 controlled path rooted to repo-local uploader data dir
    await fs.mkdir(uploaderDataDir, { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- XAUP-118 controlled path rooted to repo-local uploader data dir
    await fs.writeFile(tmpPath, serializeCurrencyRates(validated.rates), "utf8");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- XAUP-118 controlled path rooted to repo-local uploader data dir
    await fs.rename(tmpPath, ratesFilePath);
    return withRateHeaders(NextResponse.json({ ok: true }), limit);
  } catch (error) {
    if (error instanceof CatalogDraftContractError) {
      return withRateHeaders(
        buildErrorResponse("service_unavailable", 503, "currency_rates_contract_unavailable"),
        limit,
      );
    }
    return withRateHeaders(buildErrorResponse("internal_error", 500, "internal_error"), limit);
  }
}
