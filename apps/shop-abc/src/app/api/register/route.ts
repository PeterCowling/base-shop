// apps/shop-abc/src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUser,
  getUserByEmail,
} from "@platform-core/users";

const RegisterSchema = z.object({
  customerId: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { customerId, email, password } = parsed.data;

  if (await getUser(customerId)) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 400 },
    );
  }

  const hash = await bcrypt.hash(password, 10);
  await createUser(customerId, email, hash);
  return NextResponse.json({ ok: true });
}
