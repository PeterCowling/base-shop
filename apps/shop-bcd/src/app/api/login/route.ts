// apps/shop-bcd/src/app/login/route.ts
import "@acme/zod-utils/initZod";
import { NextResponse } from "next/server";
import {
  createCustomerSession,
  validateCsrfToken,
  isMfaEnabled,
  verifyMfa,
} from "@auth";
import type { Role } from "@auth/types/roles";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils";
import { RateLimiterMemory } from "rate-limiter-flexible";

export const runtime = "nodejs";

const limiter = new RateLimiterMemory({ points: 5, duration: 60 });

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
    password: z.string().min(8, "Password must be at least 8 characters"),
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
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (process.env.NODE_ENV !== "test") {
    try {
      await limiter.consume(ip);
    } catch {
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    }
  }

  const parsed = await parseJsonBody<LoginInput>(req, LoginSchema, "1mb");
  if (parsed.success === false) {
    return parsed.response;
  }

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const valid = await validateCredentials(
    parsed.data.customerId,
    parsed.data.password,
  );

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(valid.role)) {
    // Reject elevated roles
    return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
  }

  if (await isMfaEnabled(valid.customerId)) {
    const mfaToken = req.headers.get("x-mfa-token");
    if (!mfaToken) {
      return NextResponse.json({ error: "MFA token required" }, { status: 401 });
    }
    const ok = await verifyMfa(valid.customerId, mfaToken);
    if (!ok) {
      return NextResponse.json({ error: "Invalid MFA token" }, { status: 401 });
    }
  }

  const sessionOptions =
    parsed.data.remember !== undefined
      ? { remember: parsed.data.remember }
      : undefined;
  if (sessionOptions) {
    await createCustomerSession(valid, sessionOptions);
  } else {
    await createCustomerSession(valid);
  }

  return NextResponse.json({ ok: true });
}
