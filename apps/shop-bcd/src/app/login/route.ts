// apps/shop-bcd/src/app/login/route.ts
import { NextResponse } from "next/server";
import { createCustomerSession } from "@auth";
import type { Role } from "@auth/types/roles";
import { z } from "zod";
import { parseJsonBody } from "@lib/parseJsonBody";

// Mock customer store. In a real application this would be a database or external identity provider.
const CUSTOMER_STORE: Record<string, { password: string; role: Role }> = {
  cust1: { password: "password1", role: "customer" },
  viewer1: { password: "viewpass", role: "viewer" },
  admin1: { password: "adminpass", role: "admin" },
};

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

const LoginSchema = z
  .object({
    customerId: z.string(),
    password: z.string().min(8),
  })
  .strict();

export type LoginInput = z.infer<typeof LoginSchema>;

async function validateCredentials({
  customerId,
  password,
}: LoginInput): Promise<{ customerId: string; role: Role } | null> {
  const record = CUSTOMER_STORE[customerId];
  if (!record || record.password !== password) {
    return null;
  }
  return { customerId, role: record.role };
}

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, LoginSchema);
  if (!parsed.success) return parsed.error;

  const { customerId, password } = parsed.data;

  const valid = await validateCredentials({ customerId, password });

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
