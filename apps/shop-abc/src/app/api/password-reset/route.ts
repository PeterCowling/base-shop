// apps/shop-abc/src/app/api/password-reset/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  getUserByEmail,
  updateUserPassword,
} from "@acme/platform-core/users";

const schema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6),
});

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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await updateUserPassword(parsed.data.email, hash);

  return NextResponse.json({ ok: true });
}
