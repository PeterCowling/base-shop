// i18n-exempt file -- ABC-123 [ttl=2025-06-30]
// apps/cover-me-pretty/src/app/login/route.ts
import "@acme/zod-utils/initZod";
import { NextResponse } from "next/server";
import {
  createCustomerSession,
  validateCsrfToken,
  isMfaEnabled,
  verifyMfa,
} from "@acme/auth";
import type { Role } from "@acme/auth/types/roles";
import { z } from "zod";
import { parseJsonBody } from "@acme/lib/http/server";
import { createRateLimiter } from "@acme/auth/rateLimiter";
import { authEnv } from "@acme/config/env/auth";

export const runtime = "nodejs";

const limiter = createRateLimiter({ points: 5, duration: 60 });

// Mock customer store. In a real application this would be a database or external identity provider.
const CUSTOMER_STORE: Record<string, { password: string; role: Role }> = {
  cust1: { password: "pass1234", role: "customer" },
  viewer1: { password: "viewpass", role: "viewer" },
  admin1: { password: "admin123", role: "admin" },
};

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
  const record = CUSTOMER_STORE[customerId];
  if (!record || record.password !== password) {
    return null;
  }
  return { customerId, role: record.role };
}

export async function POST(req: Request) {
  if (authEnv.AUTH_PROVIDER !== "local") {
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
