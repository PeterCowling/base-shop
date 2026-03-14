/**
 * POST /api/admin/rotate-key
 *
 * Re-encrypts all ShopProviderCredential rows with a new AES-256-GCM key.
 * Authentication: Authorization: Bearer <PAYMENT_MANAGER_ADMIN_TOKEN>
 *
 * Request body (JSON):
 *   { newKey: string }  — base64-encoded 32-byte new key
 *
 * Response (200 OK):
 *   { ok: true, reEncrypted: number }
 *
 * The entire re-encryption is wrapped in a Prisma transaction.
 * If any row fails to re-encrypt, the transaction is rolled back and an
 * error is returned with no credentials changed (TC-03-06).
 *
 * Key rotation runbook:
 *   1. Generate a new key:  openssl rand -base64 32
 *   2. Update the Worker secret:
 *        wrangler secret put PAYMENT_MANAGER_ENCRYPTION_KEY
 *      (paste new key when prompted)
 *   3. Call this endpoint with the new key to re-encrypt all credentials.
 *   4. Keep the old key available for 24h before fully discarding it.
 *      If a credential was saved between step 2 and step 3, it used the
 *      new key and is already correctly encrypted.
 */

import { NextResponse } from "next/server";

import { prisma } from "@acme/platform-core/db";

import { pmLog } from "../../../../lib/auth/pmLog";
import { timingSafeEqual, validatePmAdminToken } from "../../../../lib/auth/session";
import { decrypt, encrypt } from "../../../../lib/crypto/credentials";

export const runtime = "nodejs";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Extract Bearer token from Authorization header.
 * Returns empty string if header is missing or not a Bearer scheme.
 */
function extractBearerToken(request: Request): string {
  const authHeader = request.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return "";
  return authHeader.slice("Bearer ".length).trim();
}

export async function POST(request: Request) {
  // TC-03-05: invalid admin token → 401
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const valid = await validatePmAdminToken(token);
  if (!valid) {
    pmLog("warn", "rotate_key_unauthorized", {});
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Parse and validate request body
  let body: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) {
      return NextResponse.json({ ok: false, error: "missing_body" }, { status: 400 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.newKey !== "string" || !body.newKey.trim()) {
    return NextResponse.json({ ok: false, error: "missing_new_key" }, { status: 400 });
  }

  const newKey = body.newKey.trim();

  // Guard against re-encrypting with the same key (no-op but also wasteful).
  let currentKey: string;
  try {
    currentKey = requireEnv("PAYMENT_MANAGER_ENCRYPTION_KEY");
  } catch {
    pmLog("error", "rotate_key_no_current_key", {
      message: "PAYMENT_MANAGER_ENCRYPTION_KEY not set — cannot rotate", // i18n-exempt -- PM-0003 server error [ttl=2027-12-31]
    });
    return NextResponse.json(
      { ok: false, error: "encryption_key_not_configured" },
      { status: 500 },
    );
  }

  // Timing-safe check: if keys are identical, skip re-encryption (idempotent).
  if (
    newKey.length === currentKey.length &&
    timingSafeEqual(newKey, currentKey)
  ) {
    return NextResponse.json({ ok: true, reEncrypted: 0, message: "keys_identical_noop" });
  }

  // TC-03-04 + TC-03-06: Read all credentials, re-encrypt in a transaction.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PM-0003 prisma client type varies by generated schema; safe to use any here
  const prismaAny = prisma as any;

  try {
    const credentials: Array<{
      shopId: string;
      provider: string;
      credentialKey: string;
      encryptedValue: string;
    }> = await prismaAny.shopProviderCredential.findMany({
      select: {
        shopId: true,
        provider: true,
        credentialKey: true,
        encryptedValue: true,
      },
    });

    if (credentials.length === 0) {
      pmLog("info", "rotate_key_noop", { reason: "no_credentials" });
      return NextResponse.json({ ok: true, reEncrypted: 0 });
    }

    // Pre-compute all re-encrypted values before opening the transaction.
    // This ensures the transaction is minimal — only DB writes, no async crypto inside.
    const reEncryptedRows: Array<{
      shopId: string;
      provider: string;
      credentialKey: string;
      encryptedValue: string;
    }> = [];

    for (const cred of credentials) {
      // Decrypt with current key, then re-encrypt with new key.
      const plaintext = await decrypt(cred.encryptedValue, currentKey);
      const newEncryptedValue = await encrypt(plaintext, newKey);
      reEncryptedRows.push({
        shopId: cred.shopId,
        provider: cred.provider,
        credentialKey: cred.credentialKey,
        encryptedValue: newEncryptedValue,
      });
    }

    // Apply all updates in a single transaction (TC-03-06: atomic).
    await prismaAny.$transaction(
      reEncryptedRows.map((row) =>
        prismaAny.shopProviderCredential.update({
          where: {
            shopId_provider_credentialKey: {
              shopId: row.shopId,
              provider: row.provider,
              credentialKey: row.credentialKey,
            },
          },
          data: { encryptedValue: row.encryptedValue },
        }),
      ),
    );

    pmLog("info", "rotate_key_success", { reEncrypted: reEncryptedRows.length });
    return NextResponse.json({ ok: true, reEncrypted: reEncryptedRows.length });
  } catch (err) {
    pmLog("error", "rotate_key_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { ok: false, error: "rotation_failed" },
      { status: 500 },
    );
  }
}
