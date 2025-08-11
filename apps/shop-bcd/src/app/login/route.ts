// apps/shop-bcd/src/app/login/route.ts
import { NextResponse } from "next/server";
import { createCustomerSession, validateCsrfToken } from "@auth";
import type { Role } from "@auth/types/roles";
import { z } from "zod";
import { parseJsonBody } from "@shared-utils/parseJsonBody";

// Mock customer store. In a real application this would be a database or external identity provider.
const CUSTOMER_STORE: Record<string, { password: string; role: Role }> = {
  cust1: { password: "pass1", role: "customer" },
  viewer1: { password: "view", role: "viewer" },
  admin1: { password: "admin", role: "admin" },
};

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

export const LoginSchema = z
  .object({
    customerId: z.string(),
    password: z.string().min(8),
  })
  .strict();

export type LoginRequest = z.infer<typeof LoginSchema>;

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
  const parsed = await parseJsonBody(req, LoginSchema);
  if (!parsed.success) return parsed.response;

  const csrfToken = req.headers.get("x-csrf-token");
  if (!csrfToken || !(await validateCsrfToken(csrfToken))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const { customerId, password } = parsed.data;

  const valid = await validateCredentials(customerId, password);

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!ALLOWED_ROLES.includes(valid.role)) {
    // Reject elevated roles
    return NextResponse.json({ error: "Unauthorized role" }, { status: 403 });
  }

  await createCustomerSession(valid);

  return NextResponse.json({ ok: true });
}
