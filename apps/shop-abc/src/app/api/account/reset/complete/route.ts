// apps/shop-abc/src/app/api/account/reset/complete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  getUserByResetToken,
  updateUserPassword,
  setResetToken,
} from "@platform-core/users";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }

  const user = await getUserByResetToken(parsed.data.token);
  if (!user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await updateUserPassword(user.id, passwordHash);
  await setResetToken(user.id, null);

  return NextResponse.json({ ok: true });
}
