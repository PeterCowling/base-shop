// apps/shop-abc/src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserByEmail,
} from "@acme/platform-core/users";

const schema = z
  .object({
    customerId: z.string(),
    email: z.string().email(),
    password: z.string(),
  })
  .strict();

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const existing = await getUserByEmail(parsed.data.email);
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, {
      status: 409,
    });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await createUser({
    customerId: parsed.data.customerId,
    email: parsed.data.email,
    passwordHash,
    role: "customer",
  });

  return NextResponse.json({ ok: true });
}

