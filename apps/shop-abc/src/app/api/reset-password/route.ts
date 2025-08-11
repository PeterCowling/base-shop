// apps/shop-abc/src/app/api/reset-password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserById, updatePassword } from "@platform-core/users";

const ResetSchema = z.object({
  customerId: z.string(),
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

  const { customerId, token, password } = parsed.data;
  const user = await getUserById(customerId);
  if (!user || user.resetToken !== token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updatePassword(customerId, passwordHash);
  return NextResponse.json({ ok: true });
}
