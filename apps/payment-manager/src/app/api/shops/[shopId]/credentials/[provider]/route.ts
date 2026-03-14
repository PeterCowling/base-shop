/* eslint-disable ds/no-hardcoded-copy -- PM-0001 internal operator tool API, English-only error messages [ttl=2027-12-31] */
/**
 * GET  /api/shops/:shopId/credentials/:provider
 * PUT  /api/shops/:shopId/credentials/:provider
 *
 * GET: Returns masked credential keys for the shop/provider pair.
 *      Never returns decrypted values. Format: { credentials: { [key]: "****xyz" } }
 *
 * PUT: Encrypts and stores credential key/value pairs.
 *      Request body: { credentials: { [key]: plaintext } }
 *      e.g. { credentials: { apiKey: "sk_live_abc123", shopLogin: "myshop" } }
 *
 * Response:
 *   200 { credentials: { [key]: maskedValue } }
 *   400 { ok: false, error: string }
 *   401 { ok: false, error: "unauthorized" }
 *   500 { ok: false, error: "internal_error" }
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../../../lib/auth/pmLog";
import { hasPmSession } from "../../../../../../lib/auth/session";
import { encrypt } from "../../../../../../lib/crypto/credentials";

export const runtime = "nodejs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0004 Prisma client type varies
const prismaAny = prisma as any;

const ENCRYPTION_KEY = process.env.PAYMENT_MANAGER_ENCRYPTION_KEY ?? "";

/**
 * Mask a credential value for operator display.
 * Shows last 4 characters if value is >= 8 chars, else "****".
 */
function maskValue(plaintext: string): string {
  if (plaintext.length >= 8) {
    return `****${plaintext.slice(-4)}`;
  }
  return "****";
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string; provider: string }> },
) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { shopId, provider } = await params;

  try {
    const rows: Array<{ credentialKey: string; encryptedValue: string }> =
      await prismaAny.shopProviderCredential.findMany({
        where: { shopId, provider },
        select: { credentialKey: true, encryptedValue: true },
      });

    // Return only masked representation — never the raw encrypted blob or plaintext
    const credentials: Record<string, string> = {};
    for (const row of rows) {
      // Masking is done on a synthetic indicator; encryptedValue is opaque storage
      // We indicate a credential exists using "****" (exact value not decodable here)
      credentials[row.credentialKey] = "****";
    }

    return NextResponse.json({ credentials });
  } catch (err) {
    pmLog("error", "credentials_get_failed", {
      shopId,
      provider,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shopId: string; provider: string }> },
) {
  const authenticated = await hasPmSession(request);
  if (!authenticated) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { shopId, provider } = await params;

  if (!ENCRYPTION_KEY) {
    pmLog("error", "credentials_put_missing_key", { shopId, provider });
    return NextResponse.json({ ok: false, error: "Encryption key not configured" }, { status: 503 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { credentials } = rawBody as Record<string, unknown>;
  if (!credentials || typeof credentials !== "object" || Array.isArray(credentials)) {
    return NextResponse.json(
      { ok: false, error: "credentials must be an object of key/value pairs" },
      { status: 400 },
    );
  }

  const credMap = credentials as Record<string, unknown>;

  try {
    const masked: Record<string, string> = {};

    for (const [key, value] of Object.entries(credMap)) {
      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json(
          { ok: false, error: `Credential value for '${key}' must be a non-empty string` },
          { status: 400 },
        );
      }

      const encryptedValue = await encrypt(value, ENCRYPTION_KEY);

      await prismaAny.shopProviderCredential.upsert({
        where: { shopId_provider_credentialKey: { shopId, provider, credentialKey: key } },
        create: { shopId, provider, credentialKey: key, encryptedValue },
        update: { encryptedValue },
      });

      masked[key] = maskValue(value);
    }

    // Write audit record for credential update
    await prismaAny.paymentConfigAudit.create({
      data: {
        shopId,
        changedBy: "operator",
        field: `credentials.${provider}`,
        oldValue: null,
        newValue: Object.keys(credMap).join(","),
      },
    });

    pmLog("info", "credentials_updated", {
      shopId,
      provider,
      keys: Object.keys(credMap),
    });

    return NextResponse.json({ credentials: masked });
  } catch (err) {
    pmLog("error", "credentials_put_failed", {
      shopId,
      provider,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
