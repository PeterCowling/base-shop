// apps/shop-abc/src/app/login/route.ts
import { NextResponse } from "next/server";
import { createCustomerSession } from "@auth";
import type { Role } from "@auth/types/roles";
import { z } from "zod";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
} from "../../middleware";

// Mock customer store. In a real app this would query a database or identity provider.
const CUSTOMER_STORE: Record<string, { password: string; role: Role }> = {
  cust1: { password: "pass1", role: "customer" },
  viewer1: { password: "view", role: "viewer" },
  admin1: { password: "admin", role: "admin" },
};

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

const LoginSchema = z.object({
  customerId: z.string(),
  password: z.string(),
});

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
  const json = await req.json();
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimited = checkLoginRateLimit(ip, parsed.data.customerId);
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
  clearLoginAttempts(ip, parsed.data.customerId);

  return NextResponse.json({ ok: true });
}
