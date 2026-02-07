// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
// apps/cover-me-pretty/src/app/login/route.ts
import "@acme/zod-utils/initZod";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createCustomerSession,
  isMfaEnabled,
  validateCsrfToken,
  verifyMfa,
} from "@acme/auth";
import { createRateLimiter } from "@acme/auth/rateLimiter";
import type { Role } from "@acme/auth/types/roles";
import { authEnv } from "@acme/config/env/auth";
import { parseJsonBody } from "@acme/lib/http/server";

export const runtime = "nodejs";

const limiter = createRateLimiter({ points: 5, duration: 60 });

/**
 * Local auth is for development/testing only.
 * In production, AUTH_PROVIDER should be set to an external provider (e.g., "oauth").
 * Credentials are loaded from environment variables to avoid hardcoding secrets.
 *
 * Required env vars for local auth:
 * - LOCAL_AUTH_USERS: JSON string of user credentials, e.g.:
 *   LOCAL_AUTH_USERS='{"testuser":{"passwordHash":"$argon2id$...","role":"customer"}}'
 */
function getLocalAuthUsers(): Record<string, { passwordHash: string; role: Role }> {
  if (process.env.NODE_ENV === "production") {
    // Never allow local auth in production
    return {};
  }
  const raw = process.env.LOCAL_AUTH_USERS;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, { passwordHash: string; role: Role }>;
  } catch {
    console.error("[login] Failed to parse LOCAL_AUTH_USERS"); // i18n-exempt -- dev log
    return {};
  }
}

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

export const LoginSchema = z
  .object({
    customerId: z.string(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"), // i18n-exempt -- I18N-123 server-side schema error; client maps to localized copy [ttl=2025-06-30]
    remember: z.boolean().optional(),
  })
  .strict();
export type LoginInput = z.infer<typeof LoginSchema>;

async function validateCredentials(
  customerId: string,
  password: string,
): Promise<{ customerId: string; role: Role } | null> {
  const users = getLocalAuthUsers();
  const record = users[customerId];
  if (!record) {
    return null;
  }

  // Use Argon2 for password verification
  try {
    const argon2 = await import("argon2");
    const valid = await argon2.verify(record.passwordHash, password);
    if (!valid) {
      return null;
    }
  } catch {
    // If argon2 fails or hash is invalid, reject
    return null;
  }

  return { customerId, role: record.role };
}

export async function POST(req: Request) {
  // Local auth is disabled in production and when AUTH_PROVIDER is not "local"
  if (process.env.NODE_ENV === "production" || authEnv.AUTH_PROVIDER !== "local") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 }); // i18n-exempt -- API error token, UI maps to translation
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (process.env.NODE_ENV !== "test") {
    try {
      await limiter.consume(ip);
    } catch {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 }); // i18n-exempt -- I18N-123 HTTP status text; client-facing UI translates based on status [ttl=2025-06-30]
    }
  }

  const parsed = await parseJsonBody<LoginInput>(req, LoginSchema, "1mb");
  if (parsed.success === false) {
    return parsed.response;
  }

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
  }

  const valid = await validateCredentials(
    parsed.data.customerId,
    parsed.data.password,
  );

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
  }

  if (!ALLOWED_ROLES.includes(valid.role)) {
    // Reject elevated roles
    return NextResponse.json({ error: "Unauthorized role" }, { status: 403 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
  }

  if (await isMfaEnabled(valid.customerId)) {
    const mfaToken = req.headers.get("x-mfa-token");
    if (!mfaToken) {
      return NextResponse.json({ error: "MFA token required" }, { status: 401 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
    }
    const ok = await verifyMfa(valid.customerId, mfaToken);
    if (!ok) {
      return NextResponse.json({ error: "Invalid MFA token" }, { status: 401 }); // i18n-exempt -- I18N-123 API error token; UI maps to translation [ttl=2025-06-30]
    }
  }

  await createCustomerSession(valid, { remember: parsed.data.remember });

  return NextResponse.json({ ok: true });
}
