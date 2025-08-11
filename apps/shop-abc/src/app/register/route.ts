// apps/shop-abc/src/app/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserById,
  getUserByEmail,
} from "@platform-core/users";
import { validateCsrfToken } from "@auth";

const RegisterSchema = z.object({
  customerId: z.string(),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Za-z]/, {
      message: "Password must contain a letter",
    })
    .regex(/[0-9]/, {
      message: "Password must contain a number",
    }),
});

export async function POST(req: Request) {
  const headerToken = req.headers.get("x-csrf-token");
  const valid = await validateCsrfToken(headerToken);
  if (!valid) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { customerId, email, password } = parsed.data;
  if (await getUserById(customerId)) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await createUser({ id: customerId, email, passwordHash });
  return NextResponse.json({ ok: true });
}
