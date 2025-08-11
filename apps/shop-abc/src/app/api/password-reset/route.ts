// apps/shop-abc/src/app/api/password-reset/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByEmail, updateUserPassword } from "@acme/platform-core/users";

const ResetSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = ResetSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, { status: 400 });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const hashed = await bcrypt.hash(parsed.data.password, 10);
  await updateUserPassword(user.customerId, hashed);
  return NextResponse.json({ ok: true });
}
