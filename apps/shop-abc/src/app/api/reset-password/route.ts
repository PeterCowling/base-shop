// apps/shop-abc/src/app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  getUserByResetToken,
  updatePassword,
} from "@platform-core/users";

const ResetSchema = z.object({
  token: z.string(),
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = ResetSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { token, password } = parsed.data;
  const user = await getUserByResetToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  await updatePassword(user.id, hash);
  return NextResponse.json({ ok: true });
}
