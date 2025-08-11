// apps/shop-abc/src/app/api/password-reset/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  getUserByEmail,
  updateUserPassword,
} from "@acme/platform-core/users";

const schema = z
  .object({
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

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, {
      status: 404,
    });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await updateUserPassword(user.customerId, passwordHash);

  return NextResponse.json({ ok: true });
}

