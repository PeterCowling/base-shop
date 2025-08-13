// apps/shop-abc/src/app/login/route.ts
import "@acme/lib/initZod";
import { NextResponse } from "next/server";
import { createCustomerSession, validateCsrfToken } from "@auth";
import { isMfaEnabled } from "@auth/mfa";
import type { Role } from "@auth/types/roles";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { parseJsonBody } from "@shared-utils";
import { checkLoginRateLimit, clearLoginAttempts } from "../../middleware";
import { getUserById } from "@acme/platform-core/users";

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

export const LoginSchema = z
  .object({
    customerId: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();
export type LoginInput = z.infer<typeof LoginSchema>;

async function validateCredentials(
  customerId: string,
  password: string,
): Promise<{ customerId: string; role: Role; emailVerified: boolean } | null> {
  const record = await getUserById(customerId);
  if (!record) return null;
  const match = await bcrypt.compare(password, record.passwordHash);
  if (!match) return null;
  return {
    customerId,
    role: record.role as Role,
    emailVerified: record.emailVerified,
  };
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody<LoginInput>(req, LoginSchema, "1mb");
  if (!parsed.success) return parsed.response;

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimited = await checkLoginRateLimit(ip, parsed.data.customerId);
  if (rateLimited) return rateLimited;

  const valid = await validateCredentials(
    parsed.data.customerId,
    parsed.data.password,
  );

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!valid.emailVerified) {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (!ALLOWED_ROLES.includes(valid.role)) {
    // Ignore elevated roles by rejecting them
    return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
  }

  const mfa = await isMfaEnabled(valid.customerId);
  if (mfa) {
    return NextResponse.json({ mfaRequired: true });
  }

  await createCustomerSession(valid);
  await clearLoginAttempts(ip, parsed.data.customerId);

  return NextResponse.json({ ok: true });
}
