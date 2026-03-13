/* eslint-disable ds/no-hardcoded-copy -- PM-0001 internal operator tool API, English-only error messages [ttl=2027-12-31] */
/**
 * POST /api/shops/:shopId/credentials/:provider/test
 *
 * Tests the stored credentials for a shop/provider pair.
 *   - Stripe: calls stripe.accounts.retrieve() with the decrypted key
 *   - Axerve: validates credential format only (no SOAP call in v1)
 *
 * Response:
 *   200 { ok: true }
 *   200 { ok: false, error: string }   — credential invalid / provider rejected
 *   400 { ok: false, error: string }
 *   401 { ok: false, error: "unauthorized" }
 *   404 { ok: false, error: "credentials_not_found" }
 *   503 { ok: false, error: "Encryption key not configured" }
 *   500 { ok: false, error: "internal_error" }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../../../../lib/auth/pmLog";
import { hasPmSession } from "../../../../../../../lib/auth/session";
import { decrypt } from "../../../../../../../lib/crypto/credentials";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

const ENCRYPTION_KEY = process.env.PAYMENT_MANAGER_ENCRYPTION_KEY ?? "";

/** Axerve shop login format: alphanumeric only, 3-64 chars */
function isValidAxerveShopLogin(value: string): boolean {
  return /^[a-zA-Z0-9_.-]{3,64}$/.test(value);
}

/** Axerve API key format: printable ASCII, 8-128 chars */
function isValidAxerveApiKey(value: string): boolean {
  return value.length >= 8 && value.length <= 128 && /^[\x20-\x7E]+$/.test(value);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string; provider: string }> },
) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { shopId, provider } = await params;

  if (!ENCRYPTION_KEY) {
    pmLog("error", "test_connection_missing_key", { shopId, provider });
    return NextResponse.json({ ok: false, error: "Encryption key not configured" }, { status: 503 });
  }

  try {
    const rows: Array<{ credentialKey: string; encryptedValue: string }> =
      await prismaAny.shopProviderCredential.findMany({
        where: { shopId, provider },
        select: { credentialKey: true, encryptedValue: true },
      });

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: "credentials_not_found" }, { status: 404 });
    }

    // Decrypt all credentials for this provider
    const decrypted: Record<string, string> = {};
    for (const row of rows) {
      decrypted[row.credentialKey] = await decrypt(row.encryptedValue, ENCRYPTION_KEY);
    }

    if (provider === "stripe") {
      return await testStripeCredentials(shopId, decrypted);
    }

    if (provider === "axerve") {
      return testAxerveCredentials(shopId, decrypted);
    }

    return NextResponse.json(
      { ok: false, error: `Unknown provider: ${provider}` },
      { status: 400 },
    );
  } catch (err) {
    pmLog("error", "test_connection_failed", {
      shopId,
      provider,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

async function testStripeCredentials(
  shopId: string,
  decrypted: Record<string, string>,
): Promise<NextResponse> {
  const apiKey = decrypted["apiKey"] ?? decrypted["secretKey"] ?? "";
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Stripe apiKey not found in stored credentials" });
  }

  try {
    // Use the stored key directly for a lightweight API validation call.
    // stripe singleton uses STRIPE_SECRET_KEY env var; for credential test we call Stripe REST directly.
    const res = await fetch("https://api.stripe.com/v1/account", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (res.ok) {
      pmLog("info", "test_connection_stripe_ok", { shopId });
      return NextResponse.json({ ok: true });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Stripe error body type varies
    const body = (await res.json()) as any;
    const errorMsg = body?.error?.message ?? `HTTP ${res.status}`;
    pmLog("warn", "test_connection_stripe_rejected", { shopId, error: errorMsg });
    return NextResponse.json({ ok: false, error: errorMsg });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    pmLog("warn", "test_connection_stripe_error", { shopId, error: msg });
    return NextResponse.json({ ok: false, error: msg });
  }
}

function testAxerveCredentials(
  shopId: string,
  decrypted: Record<string, string>,
): NextResponse {
  // v1: format validation only (SOAP test-connection requires Node.js SOAP client in PM — out of v1 scope)
  const shopLogin = decrypted["shopLogin"] ?? "";
  const apiKey = decrypted["apiKey"] ?? "";

  if (!shopLogin) {
    return NextResponse.json({ ok: false, error: "Axerve shopLogin not found in stored credentials" });
  }
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Axerve apiKey not found in stored credentials" });
  }

  if (!isValidAxerveShopLogin(shopLogin)) {
    return NextResponse.json({ ok: false, error: "Axerve shopLogin format is invalid (alphanumeric, 3-64 chars)" });
  }
  if (!isValidAxerveApiKey(apiKey)) {
    return NextResponse.json({ ok: false, error: "Axerve apiKey format is invalid (printable ASCII, 8-128 chars)" });
  }

  pmLog("info", "test_connection_axerve_format_ok", { shopId });
  return NextResponse.json({ ok: true });
}
