// apps/shop-abc/src/app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail, createUser } from "@acme/platform-core/users";
import type { Role } from "@auth/types/roles";

const RegisterSchema = z.object({
  customerId: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: z.enum(["customer", "viewer", "admin"]).optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  const role: Role = parsed.data.role ?? "customer";
  await createUser({
    customerId: parsed.data.customerId,
    email: parsed.data.email,
    password: hashed,
    role,
  });
  return NextResponse.json({ ok: true });
}
