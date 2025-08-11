// apps/shop-abc/src/app/forgot-password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, setResetToken } from "@platform-core/users";
import { sendEmail } from "@lib/email";
import { parseJsonBody } from "@lib/parseJsonBody";

const ForgotSchema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof ForgotSchema>;

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, ForgotSchema);
  if (!parsed.success) return parsed.error;

  const user = await getUserByEmail(parsed.data.email);
  if (user) {
    const token = Math.random().toString(36).slice(2);
    await setResetToken(user.id, token);
    await sendEmail(parsed.data.email, "Password reset", `Your token is ${token}`);
  }

  return NextResponse.json({ ok: true });
}
