// apps/shop-abc/src/app/api/account/reset/complete/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { getUserByResetToken, updatePassword } from "../../../../userStore";

const schema = z.object({
  token: z.string(),
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const { token, password } = parsed.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await getUserByResetToken(tokenHash);
  if (!user) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updatePassword(user.id, passwordHash);
  return NextResponse.json({ ok: true });
}
