// apps/shop-abc/src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  createUser,
  getUserById,
  getUserByEmail,
} from "@acme/platform-core/users";
import { parseJsonBody } from "@shared-utils";

const RegisterSchema = z
  .object({
    customerId: z.string(),
    email: z.string().email(),
    password: z.string(),
  })
  .strict();

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, RegisterSchema);
  if (!parsed.success) return parsed.response;

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
