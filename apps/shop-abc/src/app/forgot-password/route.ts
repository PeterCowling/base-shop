// apps/shop-abc/src/app/forgot-password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, setResetToken } from "@platform-core/users";
import { sendEmail } from "@lib/email";

const ForgotSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = ForgotSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(parsed.error.flatten().fieldErrors, {
      status: 400,
    });
  }

  const user = await getUserByEmail(parsed.data.email);
  if (user) {
    const token = Math.random().toString(36).slice(2);
    await setResetToken(user.id, token);
    await sendEmail(parsed.data.email, "Password reset", `Your token is ${token}`);
  }

  return NextResponse.json({ ok: true });
}
