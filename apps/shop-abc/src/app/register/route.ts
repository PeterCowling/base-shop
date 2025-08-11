// apps/shop-abc/src/app/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { addUser, findUserByEmail, getUser } from "../userStore";

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

  if (await findUserByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await addUser(customerId, email, hashed);
  return NextResponse.json({ ok: true });
}
