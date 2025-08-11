// apps/shop-abc/src/app/api/account/reset/request/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, setResetToken } from "@platform-core/users";
import { sendEmail } from "@lib/email";
import { parseJsonBody } from "@shared-utils/parseJsonBody";

export const schema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type ResetRequestBody = z.infer<typeof schema>;

export async function POST(req: Request) {
  const parsed = await parseJsonBody(req, schema);
  if (!parsed.success) return parsed.response;

  const { email } = parsed.data;
  const user = await getUserByEmail(email);
  if (user) {
    const token = Math.random().toString(36).slice(2);
    await setResetToken(user.id, token);
    await sendEmail(email, "Password reset", `Your token is ${token}`);
  }

  return NextResponse.json({ ok: true });
}
