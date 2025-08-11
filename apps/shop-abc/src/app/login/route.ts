// apps/shop-abc/src/app/login/route.ts
import { NextResponse } from "next/server";
import { createCustomerSession, validateCsrfToken } from "@auth";
import type { Role } from "@auth/types/roles";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
} from "../../middleware";
import { getUserById } from "@platform-core/users";

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

const LoginSchema = z.object({
  customerId: z.string(),
  password: z.string(),
});

async function validateCredentials(
  customerId: string,
  password: string,
): Promise<{ customerId: string; role: Role } | null> {
  const record = await getUserById(customerId);
  if (!record) return null;
  const match = await bcrypt.compare(password, record.passwordHash);
  if (!match) return null;
  return { customerId, role: record.role as Role };
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

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

  if (!ALLOWED_ROLES.includes(valid.role)) {
    // Ignore elevated roles by rejecting them
    return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
  }

  await createCustomerSession(valid);
  await clearLoginAttempts(ip, parsed.data.customerId);

  return NextResponse.json({ ok: true });
}
