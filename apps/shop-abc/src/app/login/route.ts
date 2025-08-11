// apps/shop-abc/src/app/login/route.ts
import { NextResponse } from "next/server";
import { createCustomerSession } from "@auth";
import type { Role } from "@auth/types/roles";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@acme/platform-core/users";
import { z } from "zod";

const ALLOWED_ROLES: Role[] = ["customer", "viewer"];

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

async function validateCredentials(
  email: string,
  password: string,
): Promise<{ customerId: string; role: Role } | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return null;
  }
  return { customerId: user.email, role: user.role as Role };
}

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const valid = await validateCredentials(
    parsed.data.email,
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

  return NextResponse.json({ ok: true });
}
