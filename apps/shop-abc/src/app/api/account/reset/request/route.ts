// apps/shop-abc/src/app/api/account/reset/request/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail, setResetToken } from "@platform-core/users";
import { sendEmail } from "@lib/email";
import { parseJsonBody } from "@lib/parseJsonBody";

const schema = z
  .object({
    email: z.string().email(),
  })
  .strict();

export type ResetRequestInput = z.infer<typeof schema>;

export async function POST(req: Request) {
  const result = await parseJsonBody(req, schema);
  if ("error" in result) return result.error;
  const parsed = result.data;

  const user = await getUserByEmail(parsed.email);
  if (user) {
    const token = Math.random().toString(36).slice(2);
    await setResetToken(user.id, token);
    await sendEmail(parsed.email, "Password reset", `Your token is ${token}`);
  }

  return NextResponse.json({ ok: true });
}
